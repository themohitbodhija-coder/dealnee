export const PREMIUM_AMENITY_GROUPS = [
  {
    label: 'Grand Entrance & Lifestyle',
    amenities: [
      { id: 'grand_entrance_plaza', label: 'Grand Entrance Plaza' },
      { id: 'double_height_luxury_lobby', label: 'Double-Height Luxury Lobby' },
      { id: 'dedicated_drop_off_zone', label: 'Dedicated Drop-off Zone' },
      { id: 'luxury_clubhouse', label: 'Luxury Clubhouse' },
      { id: 'concierge_services', label: 'Concierge Services' },
      { id: 'residents_lounge', label: "Residents' Lounge" },
      { id: 'sky_lounge', label: 'Sky Lounge' },
      { id: 'rooftop_cafe', label: 'Rooftop Café' },
    ],
  },
  {
    label: 'Health, Fitness & Wellness',
    amenities: [
      { id: 'fully_equipped_gymnasium', label: 'Fully Equipped Gymnasium' },
      { id: 'sky_gym', label: 'Sky Gym' },
      { id: 'yoga_meditation_studio', label: 'Yoga & Meditation Studio' },
      { id: 'luxury_spa_wellness_centre', label: 'Luxury Spa & Wellness Centre' },
      { id: 'steam_sauna_bath', label: 'Steam & Sauna Bath' },
      { id: 'jacuzzi', label: 'Jacuzzi' },
      { id: 'aerobics_zumba_studio', label: 'Aerobics & Zumba Studio' },
      { id: 'jogging_walking_track', label: 'Jogging & Walking Track' },
      { id: 'reflexology_pathway', label: 'Reflexology Pathway' },
      { id: 'outdoor_fitness_zone', label: 'Outdoor Fitness Zone' },
    ],
  },
  {
    label: 'Swimming & Recreation',
    amenities: [
      { id: 'infinity_swimming_pool', label: 'Infinity Swimming Pool' },
      { id: 'temperature_controlled_swimming_pool', label: 'Temperature-Controlled Swimming Pool' },
      { id: 'kids_swimming_pool', label: "Kids' Swimming Pool" },
      { id: 'poolside_cabanas', label: 'Poolside Cabanas' },
      { id: 'poolside_deck', label: 'Poolside Deck' },
      { id: 'indoor_games_room', label: 'Indoor Games Room' },
      { id: 'mini_theatre', label: 'Mini Theatre' },
      { id: 'billiards_snooker_room', label: 'Billiards & Snooker Room' },
      { id: 'table_tennis', label: 'Table Tennis' },
      { id: 'squash_court', label: 'Squash Court' },
    ],
  },
  {
    label: 'Sports & Outdoor Activities',
    amenities: [
      { id: 'tennis_court', label: 'Tennis Court' },
      { id: 'badminton_court', label: 'Badminton Court' },
      { id: 'basketball_court', label: 'Basketball Court' },
      { id: 'cricket_practice_net', label: 'Cricket Practice Net' },
      { id: 'golf_putting_green', label: 'Golf Putting Green' },
      { id: 'cycling_track', label: 'Cycling Track' },
      { id: 'multipurpose_sports_court', label: 'Multipurpose Sports Court' },
    ],
  },
  {
    label: 'Gardens & Family Spaces',
    amenities: [
      { id: 'landscaped_central_garden', label: 'Landscaped Central Garden' },
      { id: 'rooftop_sky_garden', label: 'Rooftop Sky Garden' },
      { id: 'zen_meditation_garden', label: 'Zen & Meditation Garden' },
      { id: 'childrens_adventure_play_area', label: "Children's Adventure Play Area" },
      { id: 'kids_indoor_activity_zone', label: "Kids' Indoor Activity Zone" },
      { id: 'senior_citizens_sit_out', label: "Senior Citizens' Sit-out" },
      { id: 'open_air_amphitheatre', label: 'Open-Air Amphitheatre' },
      { id: 'party_lawn', label: 'Party Lawn' },
      { id: 'barbecue_lounge', label: 'Barbecue Lounge' },
      { id: 'gazebo_pergola_seating', label: 'Gazebo & Pergola Seating' },
    ],
  },
  {
    label: 'Smart Living & Security',
    amenities: [
      { id: 'smart_home_automation', label: 'Smart Home Automation' },
      { id: 'video_door_phone', label: 'Video Door Phone' },
      { id: 'biometric_access_control', label: 'Biometric Access Control' },
      { id: 'cctv_surveillance_24x7', label: '24×7 CCTV Surveillance' },
      { id: 'security_gated_entry_24x7', label: '24×7 Security & Gated Entry' },
      { id: 'smart_visitor_management', label: 'Smart Visitor Management' },
      { id: 'high_speed_elevators', label: 'High-Speed Elevators' },
      { id: 'full_power_backup', label: '100% Power Backup' },
      { id: 'ev_charging_stations', label: 'EV Charging Stations' },
      { id: 'dedicated_covered_car_parking', label: 'Dedicated Covered Car Parking' },
    ],
  },
  {
    label: 'Convenience & Exclusive Services',
    amenities: [
      { id: 'coworking_business_lounge', label: 'Co-working & Business Lounge' },
      { id: 'library_reading_lounge', label: 'Library & Reading Lounge' },
      { id: 'convenience_store', label: 'Convenience Store' },
      { id: 'guest_suites', label: 'Guest Suites' },
      { id: 'pet_friendly_park', label: 'Pet-Friendly Park' },
    ],
  },
];

export const PREMIUM_AMENITY_LABELS = new Map(
  PREMIUM_AMENITY_GROUPS.flatMap(({ amenities }) => amenities.map(({ id, label }) => [id, label]))
);
