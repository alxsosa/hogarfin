-- 0008_accept_invitation.sql
-- Fixes a gap in 0001: an invited user who is not yet a household member
-- cannot SELECT their own pending invitation (household_invitations_select
-- requires membership), and has no safe path to accept it. This migration
-- adds a SECURITY DEFINER RPC that validates the token against the
-- caller's own authenticated email and performs the membership insert +
-- invitation update atomically, without needing broader SELECT access.

create or replace function public.accept_household_invitation(p_token text)
returns public.household_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.household_invitations;
  v_caller_email text;
  v_member public.household_members;
begin
  select email into v_caller_email
  from auth.users
  where id = auth.uid();

  if v_caller_email is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.household_invitations
  where token = p_token
    and status = 'PENDING'
  for update;

  if v_invite is null then
    raise exception 'Invitation not found or already used';
  end if;

  if v_invite.expires_at < now() then
    update public.household_invitations
      set status = 'EXPIRED'
      where id = v_invite.id;
    raise exception 'Invitation has expired';
  end if;

  if lower(v_invite.email) <> lower(v_caller_email) then
    raise exception 'This invitation was sent to a different email address';
  end if;

  insert into public.household_members (household_id, user_id, role, invited_by)
  values (v_invite.household_id, auth.uid(), v_invite.role, v_invite.invited_by)
  on conflict (household_id, user_id) do update
    set role = excluded.role
  returning * into v_member;

  update public.household_invitations
    set status = 'ACCEPTED', accepted_by = auth.uid()
    where id = v_invite.id;

  return v_member;
end;
$$;

comment on function public.accept_household_invitation(text) is
  'Lets an authenticated user accept a pending invitation addressed to their own email. SECURITY DEFINER because the caller is not yet a household member and cannot otherwise read the invitation row.';

-- Allow any authenticated user to call it; the function body enforces
-- that the token must match their own email.
grant execute on function public.accept_household_invitation(text) to authenticated;

-- Let an invitee look up a single pending invitation by token (e.g. to
-- show "Familia Sosa invited you" before they click accept), scoped to
-- their own email so this can't be used to enumerate other invitations.
drop policy if exists "household_invitations_select_own_email" on public.household_invitations;
create policy "household_invitations_select_own_email" on public.household_invitations
  for select using (
    status = 'PENDING'
    and email = (select email from auth.users where id = auth.uid())
  );
