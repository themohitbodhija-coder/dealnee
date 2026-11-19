-- Expand project configurations while retaining legacy IDs and area storage.
alter table public.property_units drop constraint property_units_unit_code_check;
alter table public.property_units add constraint property_units_unit_code_check
  check (unit_code ~ '^bhk[1-5](_[a-zA-Z0-9]{1,64})?$');
alter table public.property_units add column bedrooms integer check (bedrooms between 1 and 100);
alter table public.property_units add column bathrooms integer check (bathrooms between 1 and 100);
create or replace function private.validate_property_object(value jsonb, rules jsonb, path text) returns void
language plpgsql set search_path='' as $$
declare k text; v jsonb; rule text; n numeric; x jsonb;
begin
 if jsonb_typeof(value) is distinct from 'object' then raise exception 'Invalid object: %',path using errcode='22023'; end if;
 for k,v in select * from jsonb_each(value) loop
  rule := rules->>k;
  if rule is null then raise exception 'Unknown field: %.%',path,k using errcode='22023'; end if;
  if v='null'::jsonb then continue; end if;
  if rule like 'enum:%' then
   if jsonb_typeof(v)<>'string' or not (v#>>'{}'=any(string_to_array(substr(rule,6),','))) then raise exception 'Invalid enum: %.%',path,k using errcode='22023'; end if;
  elsif rule like 'text:%' then
   if jsonb_typeof(v)<>'string' or length(v#>>'{}')>split_part(rule,':',2)::integer then raise exception 'Invalid text: %.%',path,k using errcode='22023'; end if;
  elsif rule='boolean' then
   if jsonb_typeof(v)<>'boolean' then raise exception 'Invalid boolean: %.%',path,k using errcode='22023'; end if;
  elsif rule='date' then
   if jsonb_typeof(v)<>'string' or (v#>>'{}') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid date' using errcode='22023'; end if;
   begin perform (v#>>'{}')::date; exception when others then raise exception 'Invalid calendar date' using errcode='22023'; end;
  elsif rule='units' then
   if jsonb_typeof(v)<>'object' or exists(select 1 from jsonb_object_keys(v) key where key !~ '^bhk[1-5](_[a-zA-Z0-9]{1,64})?$') then raise exception 'Invalid units' using errcode='22023'; end if;
   for x in select val from jsonb_each(v) as a(key,val) loop
    perform private.validate_property_object(x,'{"bedrooms":"rooms","bathrooms":"rooms","superBuildUpArea":"decimal","carpetArea":"decimal","landArea":"decimal","price":"money"}',path||'.units');
    if nullif(x->>'superBuildUpArea','') is null or nullif(x->>'carpetArea','') is null or nullif(x->>'price','') is null or (x->>'carpetArea')::numeric >= (x->>'superBuildUpArea')::numeric then raise exception 'Incomplete unit or carpet area must be smaller' using errcode='22023'; end if;
   end loop;
  elsif rule='suitable' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>20 or exists(select 1 from jsonb_array_elements(v) e where jsonb_typeof(e)<>'string' or e#>>'{}' not in ('CORPORATE_OFFICE','RETAIL_SHOP','RESTAURANT','CAFE','CLINIC','COACHING_CENTER','SALON','WAREHOUSE','STARTUP_OFFICE','SHOWROOM','CLOUD_KITCHEN','GYM','TRAINING_CENTER')) then raise exception 'Invalid suitableFor' using errcode='22023'; end if;
  else
   if jsonb_typeof(v) not in ('string','number') or (v#>>'{}') !~ '^-?[0-9]+(\.[0-9]+)?$' or length(v#>>'{}')>24 then raise exception 'Invalid number: %.%',path,k using errcode='22023'; end if;
   n := (v#>>'{}')::numeric;
   if n<0 or (rule not like 'money%' and n>=10000000000) or (rule in ('money','decimal') and n<=0) or (rule like 'money%' and (n>=100000000000000 or scale(n)>2)) or (rule='decimal' and scale(n)>4) or (rule in ('integer','rooms') and (scale(n)>0 or n>case when rule='rooms' then 100 else 1000 end)) or (rule='count' and (n<1 or n>1000000000 or scale(n)>0)) or (rule='age' and (n>1000 or scale(n)>2)) then raise exception 'Out of range: %.%',path,k using errcode='22023'; end if;
  end if;
 end loop;
end;
$$;

create or replace function private.validate_property_payload(p jsonb) returns void
language plpgsql set search_path='' as $$
declare
 rules jsonb := '{
  "resaleInfo": {
    "approval": "enum:BDA,BMC,NONE",
    "reraNumber": "text:120",
    "expectedPrice": "money",
    "pricePerSqft": "decimal",
    "plotLength": "decimal",
    "plotWidth": "decimal",
    "frontageWidth": "decimal",
    "maintenanceCharges": "money0",
    "bookingAmount": "money0",
    "floorNumber": "integer",
    "totalFloors": "integer",
    "propertyAge": "age",
    "ownershipType": "enum:FREEHOLD,LEASEHOLD,COOPERATIVE",
    "furnishingStatus": "enum:UNFURNISHED,SEMI_FURNISHED,FULLY_FURNISHED",
    "balcony": "integer",
    "readyToMove": "boolean",
    "possessionStatus": "enum:NEW_LAUNCH,UNDER_CONSTRUCTION,READY_TO_MOVE",
    "availableFrom": "date"
  },
  "rentalInfo": {
    "monthlyRent": "money",
    "securityDeposit": "money0",
    "maintenanceCharges": "money0",
    "furnishingStatus": "enum:UNFURNISHED,SEMI_FURNISHED,FULLY_FURNISHED",
    "availableFrom": "date",
    "bedrooms": "rooms",
    "bathrooms": "rooms",
    "separateEntrance": "boolean",
    "waterSupply": "boolean",
    "petFriendly": "boolean"
  },
  "commercialDetails": {
    "price": "money",
    "builtUpArea": "decimal",
    "carpetArea": "decimal",
    "propertyStatus": "enum:NEW_LAUNCH,UNDER_CONSTRUCTION,READY_TO_MOVE",
    "ownershipType": "enum:FREEHOLD,LEASEHOLD,COOPERATIVE",
    "propertyAge": "age",
    "ceilingHeight": "decimal",
    "frontageWidth": "decimal",
    "floorNumber": "integer",
    "totalFloors": "integer",
    "facing": "enum:NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST",
    "furnishingType": "enum:UNFURNISHED,SEMI_FURNISHED,FULLY_FURNISHED",
    "suitableFor": "suitable",
    "propertyDocumentsClear": "boolean",
    "loanApproved": "boolean",
    "occupancyCertificate": "boolean",
    "tradeLicense": "boolean",
    "commercialApproval": "boolean",
    "businessAdvantages": "text:2000",
    "footfallDetails": "text:2000",
    "investmentOpportunity": "text:2000",
    "rentalIncomePotential": "text:2000",
    "primeLocationBenefits": "text:2000",
    "leaseDuration": "text:120",
    "lockInPeriod": "text:120",
    "rentEscalation": "text:500",
    "brokerageCharges": "text:500",
    "taxAndRegistration": "text:500",
    "washroom": "boolean",
    "pantryAvailability": "boolean",
    "parkingAvailability": "boolean",
    "marketArea": "text:500",
    "commercialZone": "text:500",
    "nearbyTransport": "text:500",
    "parkingSpaceAround": "text:500"
  },
  "newProjectInfo": {
    "totalUnits": "count",
    "totalProjectArea": "decimal",
    "totalProjectAreaUnit": "enum:sq_ft,sq_m,sq_yards",
    "plotLength": "decimal",
    "plotWidth": "decimal",
    "projectName": "text:200",
    "builderName": "text:200",
    "projectType": "enum:APARTMENT,VILLA,PLOT",
    "projectStatus": "enum:NEW_LAUNCH,UNDER_CONSTRUCTION,READY_TO_MOVE",
    "approval": "enum:BDA,BMC,NONE",
    "reraNumber": "text:120",
    "possessionDate": "date"
  },
  "projectPricing": {
    "startingPrice": "money",
    "priceRange": "text:200",
    "pricePerSqft": "decimal",
    "unitConfigurations": "units"
  },
  "commonInfo": {
    "carpetArea": "decimal",
    "builtUpArea": "decimal",
    "builtUpAreaVilla": "decimal",
    "floorsAvailable": "integer",
    "servantRoom": "rooms",
    "studyRoom": "rooms",
    "facing": "enum:NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST",
    "parkingCapacity": "integer",
    "roadWidth": "decimal",
    "mainRoadConnectivity": "text:500",
    "nearbyMetroRailwayAirport": "text:500",
    "googleMapLocation": "text:1000"
  }
}';
 k text; allowed text[]; v jsonb; subtype text := p->>'subcategory';
 alias_path text[]; canonical text; alias_value text;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>100000 or exists(select 1 from jsonb_object_keys(p) key where key not in ('title','description','propertyType','subcategory','category','price','area','areaUnit','plotArea','bedrooms','bathrooms','location','contact','furnishingStatus','propertyAge','amenities','facilities','furnishingItems','outdoorFeatures','featured','status','resaleInfo','rentalInfo','commercialDetails','newProjectInfo','projectPricing','commonInfo')) then raise exception 'Unknown property field or invalid payload' using errcode='22023'; end if;
 perform private.validate_property_object(p-'location'-'contact'-'amenities'-'facilities'-'furnishingItems'-'outdoorFeatures'-'resaleInfo'-'rentalInfo'-'commercialDetails'-'newProjectInfo'-'projectPricing'-'commonInfo',
 '{"title":"text:200","description":"text:20000","propertyType":"enum:BUY,RENT,COMMERCIAL","subcategory":"text:100","category":"text:100","price":"money","area":"decimal","areaUnit":"enum:sq_ft,sq_m,sq_yards,acres","plotArea":"decimal","bedrooms":"rooms","bathrooms":"rooms","furnishingStatus":"enum:UNFURNISHED,SEMI_FURNISHED,FULLY_FURNISHED","propertyAge":"age","featured":"boolean","status":"enum:available,sold,rented"}','property');
 perform private.validate_property_object((p->'location')-'latitude'-'longitude','{"address":"text:500","city":"text:120","state":"text:120","locality":"text:200","landmark":"text:500","latitude":"text:40","longitude":"text:40"}'::jsonb-'latitude'-'longitude','location');
 -- Coordinates are validated separately as signed decimals, preserving zero.
 for k in select jsonb_object_keys(rules) loop
  perform private.validate_property_object(coalesce(p->k,'{}'),rules->k,k);
 end loop;
 if (subtype not like 'RESALE_%' and coalesce(p->'resaleInfo','{}')<>'{}') or (subtype not like 'RENTAL_%' and coalesce(p->'rentalInfo','{}')<>'{}') or (p->>'propertyType'<>'COMMERCIAL' and coalesce(p->'commercialDetails','{}')<>'{}') or (subtype not like 'NEW_PROJECT_%' and (coalesce(p->'newProjectInfo','{}')<>'{}' or coalesce(p->'projectPricing','{}')<>'{}')) then raise exception 'Details do not match subtype' using errcode='22023'; end if;
 perform private.validate_property_object(p->'contact','{"phone":"text:15"}','contact');
 foreach k in array array['amenities','facilities','furnishingItems','outdoorFeatures'] loop
  allowed := case k
   when 'amenities' then array['gym','swimming_pool','parking','security','garden','balcony','modular_kitchen','air_conditioning','water_supply','elevator','sewage','gated_community','community_hall','power_backup','lift','dg_power','cctv_security','fire_fighting','visitor_parking','internet','reserved_parking','washroom','pantry','central_ac',
    'grand_entrance_plaza', 'double_height_luxury_lobby', 'dedicated_drop_off_zone', 'luxury_clubhouse', 'concierge_services',
    'residents_lounge', 'sky_lounge', 'rooftop_cafe', 'fully_equipped_gymnasium', 'sky_gym',
    'yoga_meditation_studio', 'luxury_spa_wellness_centre', 'steam_sauna_bath', 'jacuzzi', 'aerobics_zumba_studio',
    'jogging_walking_track', 'reflexology_pathway', 'outdoor_fitness_zone', 'infinity_swimming_pool', 'temperature_controlled_swimming_pool',
    'kids_swimming_pool', 'poolside_cabanas', 'poolside_deck', 'indoor_games_room', 'mini_theatre',
    'billiards_snooker_room', 'table_tennis', 'squash_court', 'tennis_court', 'badminton_court',
    'basketball_court', 'cricket_practice_net', 'golf_putting_green', 'cycling_track', 'multipurpose_sports_court',
    'landscaped_central_garden', 'rooftop_sky_garden', 'zen_meditation_garden', 'childrens_adventure_play_area', 'kids_indoor_activity_zone',
    'senior_citizens_sit_out', 'open_air_amphitheatre', 'party_lawn', 'barbecue_lounge', 'gazebo_pergola_seating',
    'smart_home_automation', 'video_door_phone', 'biometric_access_control', 'cctv_surveillance_24x7', 'security_gated_entry_24x7',
    'smart_visitor_management', 'high_speed_elevators', 'full_power_backup', 'ev_charging_stations', 'dedicated_covered_car_parking',
    'coworking_business_lounge', 'library_reading_lounge', 'convenience_store', 'guest_suites', 'pet_friendly_park']
   when 'facilities' then array['school','hospital','market','public_transport','park','restaurant','mall','atm','electrification']
   when 'furnishingItems' then array['ac','modular_kitchen','wardrobe','sofa','bed','tv_unit','geyser','false_ceiling','premium_lighting','dining_area']
   else array['private_garden','terrace','lawn_area','cctv','boundary_wall','security_cabin'] end;
  v:=coalesce(p->k,'[]');
  if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>(case when k='amenities' then cardinality(allowed) else 50 end) or exists(select 1 from jsonb_array_elements(v) e where jsonb_typeof(e)<>'string' or not(e#>>'{}'=any(allowed))) or (select count(*)<>count(distinct e) from jsonb_array_elements(v) e) then raise exception 'Invalid array: %',k using errcode='22023'; end if;
 end loop;
 -- Duplicate legacy aliases may be supplied only when they agree with typed columns.
 for alias_path,canonical in select a.path,a.canonical from (values
  (array['rentalInfo','monthlyRent'],'price'),(array['rentalInfo','bedrooms'],'bedrooms'),(array['rentalInfo','bathrooms'],'bathrooms'),
  (array['commercialDetails','price'],'price'),(array['commercialDetails','builtUpArea'],'area'),
  (array['resaleInfo','propertyAge'],'propertyAge'),(array['commercialDetails','propertyAge'],'propertyAge')
 ) a(path,canonical) loop
  alias_value:=p#>>alias_path;
  if alias_value is not null and ((p->>canonical) is null or alias_value::numeric<>(p->>canonical)::numeric) then raise exception 'Conflicting canonical field: %',canonical using errcode='22023'; end if;
 end loop;
 foreach alias_path slice 1 in array array[array['rentalInfo','furnishingStatus'],array['resaleInfo','furnishingStatus'],array['commercialDetails','furnishingType']] loop
  if p#>>alias_path is not null and (p#>>alias_path) is distinct from (p->>'furnishingStatus') then raise exception 'Conflicting furnishing status' using errcode='22023'; end if;
 end loop;
 if subtype not in ('NEW_PROJECT_PLOT','RESALE_PLOT') and (p->'facilities') ? 'electrification' then
  raise exception 'Electrification is a plot facility' using errcode='22023';
 end if;
 if subtype='RESALE_PLOT' and (
  p->>'areaUnit' is distinct from 'sq_ft' or p#>>'{resaleInfo,pricePerSqft}' is null or
  (p->>'price')::numeric is distinct from round((p->>'area')::numeric*(p#>>'{resaleInfo,pricePerSqft}')::numeric,2)
 ) then raise exception 'Invalid resale plot price' using errcode='22023'; end if;
 if subtype is distinct from 'RESALE_PLOT' and (p->'resaleInfo') ?| array['plotLength','plotWidth','frontageWidth'] then
  raise exception 'Resale plot measurements require a resale plot' using errcode='22023';
 end if;
 if subtype='NEW_PROJECT_PLOT' and coalesce(p#>'{projectPricing,unitConfigurations}','{}') <> '{}' then
  raise exception 'Plots cannot have unit configurations' using errcode='22023';
 end if;
 if subtype in ('NEW_PROJECT_PLOT','RESALE_PLOT') and (
  p->>'furnishingStatus' is not null or p->>'propertyAge' is not null or coalesce(p->'furnishingItems','[]') <> '[]' or
  (p->'commonInfo') ?| array['carpetArea','builtUpArea','builtUpAreaVilla','floorsAvailable','servantRoom','studyRoom','parkingCapacity'] or
  (p->'resaleInfo') ?| array['expectedPrice','maintenanceCharges','bookingAmount','floorNumber','totalFloors','propertyAge','furnishingStatus','balcony','readyToMove','possessionStatus','availableFrom']
 ) then raise exception 'Plots cannot have building details' using errcode='22023'; end if;
 if subtype in ('NEW_PROJECT_APARTMENT','NEW_PROJECT_VILLA') and (coalesce(p#>'{projectPricing,unitConfigurations}','{}')='{}' or nullif(p#>>'{newProjectInfo,projectName}','') is null or nullif(p#>>'{newProjectInfo,builderName}','') is null) then raise exception 'Project names and at least one complete unit required' using errcode='22023'; end if;
 if subtype like '%_PLOT' or subtype='COMMERCIAL_LAND_SALE' then
  if coalesce((p->>'bedrooms')::integer,0)<>0 or coalesce((p->>'bathrooms')::integer,0)<>0 then raise exception 'Land cannot have rooms' using errcode='22023'; end if;
 end if;
 if p#>>'{commercialDetails,carpetArea}' is not null and (p#>>'{commercialDetails,carpetArea}')::numeric >= (p->>'area')::numeric then raise exception 'Carpet area must be smaller than built-up area' using errcode='22023'; end if;
 if (p#>>'{resaleInfo,floorNumber}')::numeric > (p#>>'{resaleInfo,totalFloors}')::numeric or (p#>>'{commercialDetails,floorNumber}')::numeric > (p#>>'{commercialDetails,totalFloors}')::numeric then raise exception 'Floor exceeds total floors' using errcode='22023'; end if;
end;
$$;

create or replace function public.save_property(p_request_id uuid, p_property jsonb, p_images jsonb,
 p_id uuid default null, p_version bigint default null, p_create_session uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); saved public.properties; category uuid; namespace text; payload jsonb;
 cached private.property_write_requests; response jsonb; k text; u jsonb; loc jsonb:=p_property->'location'; coordinate text;
begin
 -- Hold access/grants against concurrent revocation until this write commits.
 perform 1 from private.user_access where user_id=actor for share;
 perform 1 from private.user_permissions where user_id=actor for share;
 if not private.has_permission('manage_properties') then raise exception 'Property management permission required' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'Request ID required' using errcode='22023'; end if;
 payload:=jsonb_build_object('action','save','property',p_property,'images',p_images,'id',p_id,'version',p_version,'session',p_create_session);
 perform pg_advisory_xact_lock(hashtextextended(actor::text||p_request_id::text,0));
 select * into cached from private.property_write_requests where actor_id=actor and request_id=p_request_id;
 if found then
  if cached.payload<>payload then raise exception 'Retry payload changed' using errcode='40001'; end if;
  return cached.response;
 end if;
 if p_id is null then
  if p_create_session is null then raise exception 'Create session required' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text||p_create_session::text,7));
  if exists(select 1 from private.property_create_sessions where actor_id=actor and session_id=p_create_session) then raise exception 'Create session already saved. Reload the saved listing.' using errcode='40001'; end if;
 end if;
 perform private.validate_property_payload(p_property);
 foreach k in array array['latitude','longitude'] loop
  coordinate:=loc->>k;
  if coordinate is not null and (jsonb_typeof(loc->k) not in ('number','string') or coordinate !~ '^-?[0-9]+(\.[0-9]+)?$' or length(coordinate)>24) then raise exception 'Invalid coordinate' using errcode='22023'; end if;
 end loop;
 select s.category_id,case when s.code like 'NEW_PROJECT_%' then 'NP' when s.code like 'RESALE_%' then 'RS' when s.property_type='RENT' then 'REN' when s.code like '%_LEASE' then 'CL' else 'CB' end
 into category,namespace from public.property_subtypes s where s.code=p_property->>'subcategory' and s.property_type=p_property->>'propertyType' and s.active;
 if category is null then raise exception 'Invalid type/subtype' using errcode='22023'; end if;
 if p_property->>'category' is distinct from (select code from public.categories where id=category) then raise exception 'Category/subtype mismatch' using errcode='22023'; end if;
 if p_id is null then
  if p_version is not null or p_create_session is null then raise exception 'Create session required' using errcode='22023'; end if;
  saved.id:=gen_random_uuid(); saved.property_id:=private.allocate_property_id(namespace); saved.posted_by:=actor; saved.version:=1; saved.views:=0; saved.created_at:=now(); saved.updated_at:=now();
 else
  if p_create_session is not null or p_version is null then raise exception 'Expected version required' using errcode='22023'; end if;
  select * into saved from public.properties where id=p_id for update;
  if not found then raise exception 'Property not found' using errcode='P0002'; end if;
  if saved.version<>p_version then raise exception 'Property changed. Reload before saving.' using errcode='40001'; end if;
  -- The original display ID stays stable when staff correct classification.
  saved.version:=saved.version+1;
 end if;
 saved.property_type:=p_property->>'propertyType'; saved.category_id:=category; saved.subtype_code:=p_property->>'subcategory';
 saved.title:=btrim(p_property->>'title'); saved.description:=btrim(p_property->>'description');
 saved.price:=(p_property->>'price')::numeric; saved.area:=(p_property->>'area')::numeric;
 saved.area_unit:=coalesce(p_property->>'areaUnit','sq_ft'); saved.plot_area:=(p_property->>'plotArea')::numeric;
 saved.bedrooms:=coalesce((p_property->>'bedrooms')::integer,0); saved.bathrooms:=coalesce((p_property->>'bathrooms')::integer,0);
 saved.address:=btrim(loc->>'address'); saved.city:=btrim(loc->>'city'); saved.state:=btrim(loc->>'state');
 saved.locality:=nullif(btrim(loc->>'locality'),''); saved.landmark:=nullif(btrim(loc->>'landmark'),'');
 saved.latitude:=(loc->>'latitude')::double precision; saved.longitude:=(loc->>'longitude')::double precision;
 saved.listing_phone:=p_property#>>'{contact,phone}'; saved.furnishing_status:=p_property->>'furnishingStatus'; saved.property_age:=(p_property->>'propertyAge')::numeric;
 saved.amenities:=array(select jsonb_array_elements_text(coalesce(p_property->'amenities','[]')));
 saved.facilities:=array(select jsonb_array_elements_text(coalesce(p_property->'facilities','[]')));
 saved.furnishing_items:=array(select jsonb_array_elements_text(coalesce(p_property->'furnishingItems','[]')));
 saved.outdoor_features:=array(select jsonb_array_elements_text(coalesce(p_property->'outdoorFeatures','[]')));
 saved.featured:=coalesce((p_property->>'featured')::boolean,false); saved.status:=coalesce(p_property->>'status','available');
 saved.updated_at:=now();
 if (saved.property_type='RENT' and saved.status='sold') or (saved.property_type<>'RENT' and saved.status='rented' and saved.subtype_code not like '%_LEASE') then raise exception 'Invalid status for property type' using errcode='22023'; end if;
 if p_id is null then insert into public.properties select saved.*;
 else update public.properties set
  property_type=saved.property_type,category_id=saved.category_id,subtype_code=saved.subtype_code,
  title=saved.title,description=saved.description,price=saved.price,area=saved.area,area_unit=saved.area_unit,plot_area=saved.plot_area,
  bedrooms=saved.bedrooms,bathrooms=saved.bathrooms,address=saved.address,city=saved.city,state=saved.state,locality=saved.locality,landmark=saved.landmark,
  latitude=saved.latitude,longitude=saved.longitude,listing_phone=saved.listing_phone,furnishing_status=saved.furnishing_status,property_age=saved.property_age,
  amenities=saved.amenities,facilities=saved.facilities,furnishing_items=saved.furnishing_items,outdoor_features=saved.outdoor_features,
  featured=saved.featured,status=saved.status,version=saved.version where id=p_id;
 end if;
 insert into public.property_details(property_id,resale_info,rental_info,commercial_details,new_project_info,project_pricing,common_info)
 values(saved.id,coalesce(p_property->'resaleInfo','{}')-'propertyAge'-'furnishingStatus',coalesce(p_property->'rentalInfo','{}')-'monthlyRent'-'bedrooms'-'bathrooms'-'furnishingStatus',coalesce(p_property->'commercialDetails','{}')-'price'-'builtUpArea'-'propertyAge'-'furnishingType',coalesce(p_property->'newProjectInfo','{}'),coalesce(p_property->'projectPricing','{}')-'unitConfigurations',coalesce(p_property->'commonInfo','{}'))
 on conflict(property_id) do update set resale_info=excluded.resale_info,rental_info=excluded.rental_info,commercial_details=excluded.commercial_details,new_project_info=excluded.new_project_info,project_pricing=excluded.project_pricing,common_info=excluded.common_info;
 delete from public.property_units where property_id=saved.id;
 for k,u in select * from jsonb_each(coalesce(p_property#>'{projectPricing,unitConfigurations}','{}')) loop
  insert into public.property_units(property_id,unit_code,super_built_up_area,carpet_area,land_area,price,bedrooms,bathrooms)
  values(saved.id,k,(u->>'superBuildUpArea')::numeric,(u->>'carpetArea')::numeric,(u->>'landArea')::numeric,(u->>'price')::numeric,(u->>'bedrooms')::integer,(u->>'bathrooms')::integer);
 end loop;
 perform private.attach_property_images(actor,saved.id,p_create_session,p_images);
 if p_id is null then
  insert into private.property_create_sessions values(actor,p_create_session,p_request_id,saved.id);
 end if;
 response:=jsonb_build_object('success',true,'property',private.property_dto(saved));
 insert into private.property_write_requests(actor_id,request_id,payload,response) values(actor,p_request_id,payload,response);
 insert into private.audit_events(actor_id,operation,target_id,summary) values(actor,case when p_id is null then 'property.create' else 'property.update' end,saved.id,jsonb_build_object('version',saved.version));
 return response;
end;
$$;

create or replace function private.property_dto(p public.properties) returns jsonb
language sql stable security definer set search_path = '' as $$
select jsonb_build_object(
  '_id',p.id,'id',p.id,'propertyId',p.property_id,'propertyType',p.property_type,
  'category',(select jsonb_build_object('_id',c.id,'name',c.name,'code',c.code) from public.categories c where c.id=p.category_id),
  'subcategory',p.subtype_code,'title',p.title,'description',p.description,
  'price',p.price::text,'area',p.area::text,'areaUnit',p.area_unit,'plotArea',p.plot_area::text,
  'bedrooms',p.bedrooms,'bathrooms',p.bathrooms,'bathroom2',p.bathrooms,
  'location',jsonb_build_object('address',p.address,'city',p.city,'state',p.state,
    'locality',p.locality,'landmark',p.landmark,'latitude',p.latitude,'longitude',p.longitude),
  'propertyDetails',coalesce(d.common_info,'{}'::jsonb),
  'contact',jsonb_build_object('phone',p.listing_phone),
  'amenities',p.amenities,'facilities',p.facilities,'furnishingItems',p.furnishing_items,
  'outdoorFeatures',p.outdoor_features,'furnishingStatus',p.furnishing_status,
  'featured',p.featured,'status',p.status,'views',p.views,'version',p.version,
  'createdAt',p.created_at,'updatedAt',p.updated_at,
  'images',coalesce((select jsonb_agg(i.object_key order by i.sort_order) from public.property_images i where i.property_id=p.id),'[]'::jsonb),
  'imageRecords',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'objectKey',i.object_key,'sortOrder',i.sort_order) order by i.sort_order) from public.property_images i where i.property_id=p.id),'[]'::jsonb),
  'resaleInfo',coalesce(d.resale_info,'{}'::jsonb) || case when p.property_type='BUY' then jsonb_build_object('furnishingStatus',p.furnishing_status,'propertyAge',p.property_age) else '{}'::jsonb end,
  'rentalInfo',coalesce(d.rental_info,'{}'::jsonb) || case when p.property_type='RENT' then jsonb_build_object('monthlyRent',p.price::text,'bedrooms',p.bedrooms,'bathrooms',p.bathrooms,'furnishingStatus',p.furnishing_status) else '{}'::jsonb end,
  'commercialDetails',coalesce(d.commercial_details,'{}'::jsonb) || case when p.property_type='COMMERCIAL' then jsonb_build_object('price',p.price::text,'builtUpArea',p.area::text,'furnishingType',p.furnishing_status,'propertyAge',p.property_age) else '{}'::jsonb end,
  'newProjectInfo',coalesce(d.new_project_info,'{}'::jsonb),
  'projectPricing',coalesce(d.project_pricing,'{}'::jsonb) || jsonb_build_object('unitConfigurations',coalesce((
    select jsonb_object_agg(u.unit_code,jsonb_build_object('superBuildUpArea',u.super_built_up_area::text,
      'bedrooms',coalesce(u.bedrooms,substring(u.unit_code from '^bhk([1-5])')::integer),'bathrooms',u.bathrooms,'carpetArea',u.carpet_area::text,'landArea',u.land_area::text,'price',u.price::text))
      from public.property_units u where u.property_id=p.id),'{}'::jsonb))
) from (values(1)) dummy(n) left join public.property_details d on d.property_id=p.id;
$$;
