import {propertyWritePayload} from './propertyWritePayload';
import {INITIAL_FORM_STATE,initializePropertyFormState} from '../reducers/propertyFormReducer';
import {saveFormToLocalStorage,loadFormFromLocalStorage} from './propertyFormUtils';
const subtypes=['NEW_PROJECT_APARTMENT','NEW_PROJECT_VILLA','NEW_PROJECT_PLOT','RESALE_FLAT','RESALE_VILLA','RESALE_PLOT','RENTAL_FLAT','RENTAL_VILLA','RENTAL_INDIVIDUAL_FLOOR','COMMERCIAL_OFFICE_SALE','COMMERCIAL_SHOP_SALE','COMMERCIAL_SHOWROOM_SALE','COMMERCIAL_LAND_SALE','COMMERCIAL_WAREHOUSE_SALE','COMMERCIAL_INDUSTRIAL_SALE','COMMERCIAL_COWORKING_SALE','COMMERCIAL_OFFICE_LEASE','COMMERCIAL_SHOP_LEASE','COMMERCIAL_WAREHOUSE_LEASE'];
const fixture=(subtype='RESALE_FLAT')=>initializePropertyFormState({...INITIAL_FORM_STATE,basicInfo:{...INITIAL_FORM_STATE.basicInfo,title:' Test title ',description:'Description',propertyType:subtype.startsWith('COMMERCIAL')?'COMMERCIAL':subtype.startsWith('RENTAL')?'RENT':'BUY',subcategory:subtype},propertyDetails:{...INITIAL_FORM_STATE.propertyDetails,price:'12345678901234.12',area:'1000.1234',bedrooms:0,bathrooms:0,featured:false},location:{address:'Street',city:'City',state:'State',latitude:0,longitude:0},resaleInfo:{floorNumber:0,readyToMove:false},commercialDetails:{...INITIAL_FORM_STATE.commercialDetails,price:'12345678901234.12',builtUpArea:'1000.1234',parkingAvailability:false,floorNumber:0},rentalInfo:{monthlyRent:'12345678901234.12',securityDeposit:'0',maintenanceCharges:'0'}});
test.each(subtypes)('%s maps canonical classification and only applicable details',subtype=>{
  const payload=propertyWritePayload(fixture(subtype));
  expect(payload.subcategory).toBe(subtype); expect(payload.price).toBe('12345678901234.12'); expect(payload.area).toBe('1000.1234');
  expect(Boolean(payload.commercialDetails)).toBe(subtype.startsWith('COMMERCIAL'));
  expect(Boolean(payload.rentalInfo)).toBe(subtype.startsWith('RENTAL'));
  expect(Boolean(payload.resaleInfo)).toBe(subtype.startsWith('RESALE'));
  expect(Boolean(payload.newProjectInfo)).toBe(subtype.startsWith('NEW_PROJECT'));
  expect(payload).not.toHaveProperty('userId'); expect(payload).not.toHaveProperty('propertyId');
});
test('zero coordinates/rooms/floors and false parking survive without floating-point conversion',()=>{
  const payload=propertyWritePayload(fixture('COMMERCIAL_OFFICE_SALE'));
  expect(payload.location.latitude).toBe('0'); expect(payload.location.longitude).toBe('0');
  expect(payload.bedrooms).toBe(0); expect(payload.commercialDetails.floorNumber).toBe('0'); expect(payload.commercialDetails.parkingAvailability).toBe(false);
});
test('empty optional numbers become null and incomplete units stay visible to server validation',()=>{
  const form=fixture('NEW_PROJECT_APARTMENT'); form.projectPricing={unitConfigurations:{bhk2:{price:'100'},bhk3:{price:'',carpetArea:''}}};
  const payload=propertyWritePayload(form);
  expect(payload.plotArea).toBeNull(); expect(payload.projectPricing.unitConfigurations).toEqual({bhk2:{price:'100'}});
});
test('draft round trip keeps validated photo IDs and create scope while removing blob previews',()=>{
  const form={...fixture(),createSessionId:'77000000-0000-4000-8000-000000000001',images:[{uploadId:'76000000-0000-4000-8000-000000000001',uploadState:'validated',preview:'blob:temporary',name:'photo.jpg'}]};
  saveFormToLocalStorage(form); const restored=loadFormFromLocalStorage();
  expect(restored.createSessionId).toBe(form.createSessionId); expect(restored.images[0].uploadId).toBe(form.images[0].uploadId); expect(restored.images[0].preview).toBe('');
});
