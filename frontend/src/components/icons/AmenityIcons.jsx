import React from 'react';
import {
  FaDumbbell,
  FaCar,
  FaShieldAlt,
  FaLeaf,
  FaUmbrellaBeach,
  FaUtensils,
  FaSnowflake,
  FaTint,
  FaRecycle,
  FaDoorClosed,
  FaUsers,
  FaBolt,
  FaCheckCircle,
  FaBuilding,
  FaVideo,
  FaWifi,
  FaFireExtinguisher,
  FaToilet,
  FaCoffee,
  FaTv,
  FaBed,
  FaCouch,
  FaShower,
  FaLightbulb,
  FaChair,
  FaSchool,
  FaHospital,
  FaStore,
  FaBus,
  FaTree,
  FaMoneyBillWave,
  FaWarehouse,
} from 'react-icons/fa';

// Full mapping of amenity/facility id -> icon component.
// Covers AMENITIES, FACILITIES, FURNISHING_ITEMS, OUTDOOR_FEATURES and
// COMMERCIAL_AMENITIES ids used across the app, plus a few common legacy
// names (e.g. "cctv_surveillance") that may exist in older saved data.
const ICON_MAP = {
  // Residential amenities
  gym: <FaDumbbell />,
  swimming_pool: <FaBuilding />,
  parking: <FaCar />,
  security: <FaShieldAlt />,
  garden: <FaLeaf />,
  balcony: <FaUmbrellaBeach />,
  modular_kitchen: <FaUtensils />,
  air_conditioning: <FaSnowflake />,
  water_supply: <FaTint />,
  elevator: <FaBuilding />,
  sewage: <FaRecycle />,
  gated_community: <FaDoorClosed />,
  community_hall: <FaUsers />,
  power_backup: <FaBolt />,

  // Facilities (nearby)
  school: <FaSchool />,
  hospital: <FaHospital />,
  market: <FaStore />,
  public_transport: <FaBus />,
  park: <FaTree />,
  restaurant: <FaUtensils />,
  mall: <FaStore />,
  atm: <FaMoneyBillWave />,

  // Furnishing items
  ac: <FaSnowflake />,
  wardrobe: <FaDoorClosed />,
  sofa: <FaCouch />,
  bed: <FaBed />,
  tv_unit: <FaTv />,
  geyser: <FaShower />,
  false_ceiling: <FaLightbulb />,
  premium_lighting: <FaLightbulb />,
  dining_area: <FaChair />,

  // Outdoor features
  private_garden: <FaLeaf />,
  terrace: <FaUmbrellaBeach />,
  lawn_area: <FaTree />,
  cctv: <FaVideo />,
  boundary_wall: <FaDoorClosed />,
  security_cabin: <FaShieldAlt />,

  // Commercial amenities
  lift: <FaBuilding />,
  dg_power: <FaBolt />,
  cctv_security: <FaVideo />,
  fire_fighting: <FaFireExtinguisher />,
  visitor_parking: <FaCar />,
  internet: <FaWifi />,
  reserved_parking: <FaCar />,
  washroom: <FaToilet />,
  pantry: <FaCoffee />,
  central_ac: <FaSnowflake />,
  warehouse: <FaWarehouse />,

  // Common legacy / alternate names seen in older saved data
  cctv_surveillance: <FaVideo />,
  wifi: <FaWifi />,
  club_house: <FaUsers />,
  clubhouse: <FaUsers />,
  fire_safety: <FaFireExtinguisher />,
  rain_water_harvesting: <FaTint />,
  intercom: <FaWifi />,
  jogging_track: <FaTree />,
  kids_play_area: <FaUsers />,

  // Larger admin "New Project" style amenity list seen on live site
  landscaped_garden: <FaLeaf />,
  multipurpose_hall: <FaUsers />,
  childrens_play_area: <FaUsers />,
  jogging_cycling_track: <FaTree />,
  indoor_games: <FaUsers />,
  amphitheatre: <FaUsers />,
  senior_citizen_sitout: <FaChair />,
  yoga_meditation_area: <FaLeaf />,
  party_lawn: <FaTree />,
  basketball_court: <FaUsers />,
  tennis_court: <FaUsers />,
  skating_rink: <FaUsers />,
  rainwater_harvesting: <FaTint />,
  waste_management: <FaRecycle />,
  intercom_facility: <FaWifi />,
  vaastu_compliant: <FaCheckCircle />,
  ev_charging_point: <FaBolt />,
  solar_power: <FaBolt />,
  library: <FaSchool />,
  cafeteria: <FaCoffee />,
};

// Normalizes any id/label to snake_case so slight differences in naming
// ("CCTV Surveillance", "cctv-surveillance", " CCTV_Surveillance ") still
// match the same map entry.
const normalize = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const AmenityIcons = ({ id, className = 'text-red-600 w-5 h-5' }) => {
  const icon = ICON_MAP[normalize(id)] || <FaCheckCircle />;
  return React.cloneElement(icon, { className });
};

export default AmenityIcons;