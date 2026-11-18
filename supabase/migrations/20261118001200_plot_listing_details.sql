-- Add residential plot measurements and validate plot-specific writes.
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
