-- Production reference data belongs in a migration: db push does not run seed.sql.
insert into public.categories(code, name, description, icon, is_system) values
 ('BUY_PROPERTY','Buy Property','Properties available for purchase','🛒',true),
 ('NEW_PROJECT','New Projects','New residential and commercial projects','✨',true),
 ('APARTMENT','Apartment','Apartments in new projects','🏢',true),
 ('VILLA','Villa','Villas in new projects','🏡',true),
 ('PLOT','Plot','Plots in new projects','🌳',true),
 ('RESALE','Resale','Resale properties ready for immediate possession','🏠',true),
 ('RENT','Rent Property','Properties available for rent','🔑',true),
 ('COMMERCIAL_ROOT','Commercial','Commercial spaces and offices','🏢',true),
 ('COMMERCIAL_BUY','Commercial Buy','Commercial properties for purchase','🛒',true),
 ('COMMERCIAL_LEASE','Commercial Lease','Commercial properties for lease','📋',true)
on conflict(code) do nothing;

update public.categories c set parent_id = p.id from public.categories p
where (c.code in ('NEW_PROJECT','RESALE') and p.code = 'BUY_PROPERTY')
   or (c.code in ('APARTMENT','VILLA','PLOT') and p.code = 'NEW_PROJECT')
   or (c.code in ('COMMERCIAL_BUY','COMMERCIAL_LEASE') and p.code = 'COMMERCIAL_ROOT');

insert into public.property_subtypes(code, property_type, category_id, label)
select v.code, v.property_type, c.id, v.label from (values
 ('NEW_PROJECT_APARTMENT','BUY','NEW_PROJECT','New Project - Apartment'),
 ('NEW_PROJECT_VILLA','BUY','NEW_PROJECT','New Project - Villa'),
 ('NEW_PROJECT_PLOT','BUY','NEW_PROJECT','New Project - Plot'),
 ('RESALE_FLAT','BUY','RESALE','Resale - Flat'),
 ('RESALE_VILLA','BUY','RESALE','Resale - Villa'),
 ('RESALE_PLOT','BUY','RESALE','Resale - Plot'),
 ('RENTAL_FLAT','RENT','RENT','Flat'),
 ('RENTAL_VILLA','RENT','RENT','Villa/Duplex'),
 ('RENTAL_INDIVIDUAL_FLOOR','RENT','RENT','Individual Floor'),
 ('COMMERCIAL_OFFICE_SALE','COMMERCIAL','COMMERCIAL_BUY','Office - Sale'),
 ('COMMERCIAL_SHOP_SALE','COMMERCIAL','COMMERCIAL_BUY','Shop - Sale'),
 ('COMMERCIAL_SHOWROOM_SALE','COMMERCIAL','COMMERCIAL_BUY','Showroom - Sale'),
 ('COMMERCIAL_LAND_SALE','COMMERCIAL','COMMERCIAL_BUY','Land - Sale'),
 ('COMMERCIAL_WAREHOUSE_SALE','COMMERCIAL','COMMERCIAL_BUY','Warehouse - Sale'),
 ('COMMERCIAL_INDUSTRIAL_SALE','COMMERCIAL','COMMERCIAL_BUY','Industrial - Sale'),
 ('COMMERCIAL_COWORKING_SALE','COMMERCIAL','COMMERCIAL_BUY','Co-working - Sale'),
 ('COMMERCIAL_OFFICE_LEASE','COMMERCIAL','COMMERCIAL_LEASE','Office - Lease'),
 ('COMMERCIAL_SHOP_LEASE','COMMERCIAL','COMMERCIAL_LEASE','Shop - Lease'),
 ('COMMERCIAL_WAREHOUSE_LEASE','COMMERCIAL','COMMERCIAL_LEASE','Warehouse - Lease')
) as v(code, property_type, category_code, label)
join public.categories c on c.code = v.category_code
on conflict(code) do nothing;
