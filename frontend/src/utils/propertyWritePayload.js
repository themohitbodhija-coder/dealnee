const rules = {
  "resaleInfo": {
    "approval": "enum:BDA,BMC,NONE",
    "reraNumber": "text:120",
    "expectedPrice": "money",
    "pricePerSqft": "decimal",
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
};
const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const present = value => value !== '' && value !== null && value !== undefined;
const decimal = value => present(value) ? String(value).trim() : null;
function details(source = {}, schema) {
  return Object.fromEntries(Object.entries(schema).filter(([key]) => present(source[key])).map(([key,rule]) => {
    let value=source[key];
    if(rule==='units') {
      value=Object.fromEntries(Object.entries(value).filter(([,unit])=>Object.values(unit).some(present)).map(([code,unit])=>[code,details(unit,{superBuildUpArea:'decimal',carpetArea:'decimal',landArea:'decimal',price:'money'})]));
    } else if(['money','money0','decimal','integer','rooms','age'].includes(rule)) value=decimal(value);
    else if(typeof value==='string') value=value.trim();
    return [key,value];
  }));
}
export function propertyWritePayload(form, status = 'available') {
  const basic=form.basicInfo||{}, common=form.propertyDetails||{}, rental=form.rentalInfo||{}, commercial=form.commercialDetails||{};
  const isRent=basic.propertyType==='RENT', isCommercial=basic.propertyType==='COMMERCIAL';
  const isNew=basic.subcategory?.startsWith('NEW_PROJECT_'), isResale=basic.subcategory?.startsWith('RESALE_');
  const location=form.location||{};
  const category=isCommercial ? (basic.subcategory?.endsWith('_LEASE')?'COMMERCIAL_LEASE':'COMMERCIAL_BUY') : isRent?'RENT':isNew?'NEW_PROJECT':'RESALE';
  const land=basic.subcategory?.endsWith('_PLOT') || basic.subcategory==='COMMERCIAL_LAND_SALE';
  const payload={
    title:(basic.title||'').trim(),description:(basic.description||'').trim(),propertyType:basic.propertyType,subcategory:basic.subcategory,category,
    price:decimal(isRent ? (rental.monthlyRent || common.price) : isCommercial ? (commercial.price || common.price) : common.price),
    area:decimal(isCommercial ? (commercial.builtUpArea || common.area) : common.area),areaUnit:common.areaUnit||'sq_ft',plotArea:decimal(common.plotArea),
    bedrooms:land?0:(present(common.bedrooms)?common.bedrooms:present(rental.bedrooms)?rental.bedrooms:0),bathrooms:land?0:(present(common.bathrooms)?common.bathrooms:present(rental.bathrooms)?rental.bathrooms:0),
    location:Object.fromEntries(['address','city','state','locality','landmark'].map(key=>[key,(location[key]||'').trim()||null])),
    contact:{phone:String(form.contact?.phone||'').replace(/\D/g,'')},
    furnishingStatus:(isCommercial?commercial.furnishingType:isRent?rental.furnishingStatus:form.resaleInfo?.furnishingStatus)||common.furnishing||null,
    propertyAge:decimal(isCommercial?commercial.propertyAge:isResale?form.resaleInfo?.propertyAge:null),
    featured:common.featured===true,status,
    amenities:common.amenities||[],facilities:(common.facilities||[]).filter(v=>v!=='bank'),furnishingItems:common.furnishingItems||[],outdoorFeatures:common.outdoorFeatures||[],
    commonInfo:details({...location,...common},rules.commonInfo),
  };
  payload.location.latitude=decimal(location.latitude); payload.location.longitude=decimal(location.longitude);
  if(isResale) payload.resaleInfo=omit(details(form.resaleInfo,rules.resaleInfo),['propertyAge','furnishingStatus']);
  if(isRent) payload.rentalInfo=omit(details(rental,rules.rentalInfo),['monthlyRent','bedrooms','bathrooms','furnishingStatus']);
  if(isCommercial) payload.commercialDetails=omit(details(commercial,rules.commercialDetails),['price','builtUpArea','propertyAge','furnishingType']);
  if(isNew) {
    payload.newProjectInfo=details(form.newProjectInfo,rules.newProjectInfo);
    payload.projectPricing=details(form.projectPricing,rules.projectPricing);
  }
  return payload;
}
