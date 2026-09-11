-- 0007_seed_default_categories.sql
-- Function to seed a default category set for a household (Mexico-focused),
-- callable manually or automatically via trigger on household creation.

create or replace function public.seed_default_categories(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_group record;
  v_sub text;
begin
  -- Do nothing if this household already has categories (idempotent).
  if exists (select 1 from public.categories where household_id = p_household_id) then
    return;
  end if;

  for v_group in
    select * from (values
      ('Vivienda',       1, '🏠', '#6366F1', array['Renta/Hipoteca','Mantenimiento','Predial','Seguro de hogar']),
      ('Alimentación',   2, '🍽️', '#F59E0B', array['Supermercado','Restaurantes','Café/Antojos']),
      ('Transporte',     3, '🚗', '#10B981', array['Gasolina','Transporte público','Uber/Taxi','Mantenimiento auto','Estacionamiento']),
      ('Servicios',      4, '💡', '#3B82F6', array['Luz','Agua','Gas','Internet','Teléfono','Streaming']),
      ('Familia',        5, '👨‍👩‍👧', '#EC4899', array['Colegiaturas','Salud','Cuidado infantil','Mascotas']),
      ('Entretenimiento',6, '🎮', '#8B5CF6', array['Salidas','Cine','Hobbies','Vacaciones']),
      ('Ahorro',         7, '💰', '#22C55E', array['Fondo de emergencia','Inversión','Metas']),
      ('Deudas',         8, '💳', '#EF4444', array['Tarjeta de crédito','Préstamo personal','Otros pagos']),
      ('Otros',          9, '📦', '#6B7280', array['Sin categorizar','Varios'])
    ) as g(name, sort_order, icon, color, subs)
  loop
    insert into public.categories (household_id, parent_id, name, icon, color, sort_order, is_system)
    values (p_household_id, null, v_group.name, v_group.icon, v_group.color, v_group.sort_order, true)
    returning id into v_group_id;

    for v_sub in select unnest(v_group.subs)
    loop
      insert into public.categories (household_id, parent_id, name, sort_order, is_system)
      values (p_household_id, v_group_id, v_sub, 0, true);
    end loop;
  end loop;
end;
$$;

comment on function public.seed_default_categories(uuid) is
  'Seeds the default Mexico-focused category set (groups + subcategories) for a household. Idempotent: no-op if the household already has categories. Callable manually or via on_household_created_seed_categories trigger.';

-- Auto-seed on household creation.
create or replace function public.handle_household_seed_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

drop trigger if exists on_household_created_seed_categories on public.households;
create trigger on_household_created_seed_categories
  after insert on public.households
  for each row execute function public.handle_household_seed_categories();
