import React, {
  useReducer,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { isNewProject, isNewProjectCategory } from '../../constants/propertyConstants';
import {
  propertyFormReducer,
  createResetFormAction,
  INITIAL_FORM_STATE,
  initializePropertyFormState,
} from '../../reducers/propertyFormReducer';
import {
  validateCompleteForm,
} from '../../validation/propertyValidation';
import {
  saveFormToLocalStorage,
  loadFormFromLocalStorage,
  clearFormFromLocalStorage,
  getFormProgress,
  transformFormDataForSubmission,
  validateFormDataShape,
  cleanCorruptedLocalStorage,
} from '../../utils/propertyFormUtils';
import { propertyService } from '../../services/api';
import { usesSupabase } from '../../lib/backend';
import { propertyWritePayload } from '../../utils/propertyWritePayload';
import { propertyFieldIssues, propertySubmissionFeedback } from '../../utils/propertySubmissionFeedback';
import { imageReferences, createPhotoSession } from '../../services/photoService';
import BasicInfoStep from './property-steps/BasicInfoStep';
import LocationStep from './property-steps/LocationStep';
import ContactStep from './property-steps/ContactStep';
import PropertyDetailsStep from './property-steps/PropertyDetailsStep';
import ProjectDetailsStep from './property-steps/ProjectDetailsStep';
import ImagesStep from './property-steps/ImagesStep';
import ReviewStep from './property-steps/ReviewStep';

// ==================== CONSTANTS ====================
const BASE_FORM_STEPS = [
  { id: 'basic_info', label: 'Basic Info', component: BasicInfoStep },
  { id: 'location', label: 'Location', component: LocationStep },
  { id: 'contact', label: 'Contact', component: ContactStep },
  { id: 'details', label: 'Details', component: PropertyDetailsStep },
  { id: 'images', label: 'Images', component: ImagesStep },
  { id: 'review', label: 'Review', component: ReviewStep },
];

// Increased timeout for large file uploads (60 seconds instead of 30)
const SUBMISSION_TIMEOUT_MS = 60000;
const SCROLL_BEHAVIOR = { behavior: 'smooth', block: 'start' };

// ==================== HELPER FUNCTIONS ====================
/**
 * Get dynamic form steps based on property type
 */
const getFormSteps = (formData) => {
  try {
    const { category, subcategory } = formData?.basicInfo ?? {};
    const steps = [...BASE_FORM_STEPS];
    const isNewProjectSelection = isNewProject(subcategory) || isNewProjectCategory(category);

    // Insert ProjectDetailsStep after PropertyDetailsStep for new projects
    if (isNewProjectSelection) {
      const detailsIndex = steps.findIndex((s) => s.id === 'details');
      if (detailsIndex !== -1 && !steps.find((s) => s.id === 'project_details')) {
        steps.splice(detailsIndex + 1, 0, {
          id: 'project_details',
          label: 'Project Info',
          component: ProjectDetailsStep,
        });
      }
    }

    return steps;
  } catch (error) {
    console.error('Error calculating form steps:', error);
    return BASE_FORM_STEPS;
  }
};

/**
 * Validate and clamp current step to valid range
 */
const getValidCurrentStep = (currentStep, stepsLength) => {
  const maxStep = Math.max(0, stepsLength - 1);
  return Math.min(Math.max(0, currentStep), maxStep);
};

// ==================== UI COMPONENTS ====================
/**
 * ProgressBar Component
 * Shows visual progress of form completion
 */
const ProgressBar = React.memo(({ percentage }) => (
  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-sm">
    <div
      className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-full transition-all duration-500 ease-out"
      style={{ width: `${Math.round(percentage)}%` }}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
));
ProgressBar.displayName = 'ProgressBar';

/**
 * StepIndicator Component
 * Shows current progress through form steps with clickable navigation
 */
const StepIndicator = React.memo(({ steps, currentStep, onStepClick }) => (
  <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <button
          onClick={() => onStepClick(index)}
          disabled={index > currentStep}
          aria-current={index === currentStep ? 'step' : undefined}
          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            index === currentStep
              ? 'bg-blue-600 text-white shadow-lg'
              : index < currentStep
              ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          title={`${step.label} (Step ${index + 1} of ${steps.length})`}
        >
          {index < currentStep ? <FaCheckCircle /> : index + 1}
        </button>
        {index < steps.length - 1 && (
          <div
            className={`flex-shrink-0 h-1 mx-2 flex-1 max-w-xs transition-colors duration-300 ${
              index < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
));
StepIndicator.displayName = 'StepIndicator';

/**
 * NavigationButtons Component
 * Handles navigation between steps and form submission
 */
const NavigationButtons = React.memo(
  ({
    currentStep,
    totalSteps,
    onPrev,
    onNext,
    onSubmit,
    loading,
    nextButtonDisabled,
  }) => (
    <div className="flex justify-between items-center gap-4 flex-wrap w-full">
      <button
        onClick={onPrev}
        disabled={currentStep === 0 || loading}
        className={`px-6 py-3 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 whitespace-nowrap ${
          currentStep === 0 || loading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800'
        }`}
      >
        ← Previous
      </button>

      <span className="text-gray-600 font-medium text-sm md:text-base">
        Step {currentStep + 1} of {totalSteps}
      </span>

      {currentStep === totalSteps - 1 ? (
        <button
          onClick={onSubmit}
          disabled={loading || nextButtonDisabled}
          className={`min-w-[150px] px-8 py-3 rounded-lg font-bold transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 whitespace-nowrap ${
            loading || nextButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-lg border-2 border-green-600'
          }`}
        >
          {loading && <FaSpinner className="animate-spin" />}
          {loading ? 'Submitting...' : 'Submit Property'}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={nextButtonDisabled || loading}
          className={`min-w-[120px] px-8 py-3 rounded-lg font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap ${
            nextButtonDisabled || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg border-2 border-blue-600'
          }`}
        >
          Next →
        </button>
      )}
    </div>
  )
);
NavigationButtons.displayName = 'NavigationButtons';

/**
 * ErrorAlert Component
 * Displays error messages with optional retry button
 */
const ErrorAlert = ({ issue, steps, onEdit, onRetry, alertRef }) => (
  <div ref={alertRef} role="alert" tabIndex={-1} className="scroll-mt-24 mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
    <p className="flex items-center gap-2 font-semibold">
      <FaExclamationCircle aria-hidden="true" />
      {issue.message}
    </p>
    {issue.issues.length > 0 && (
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
        {issue.issues.map(({ field, label, message, stepId }, index) => {
          const step = steps.find(item => item.id === stepId);
          return (
            <li key={`${field}-${index}`}>
              {label && <strong className="capitalize">{label}: </strong>}{message}
              {step && <button type="button" onClick={() => onEdit(step.id, true)} className="ml-2 underline">Edit {step.label}</button>}
            </li>
          );
        })}
      </ul>
    )}
    {issue.retryable && <button type="button" onClick={onRetry} className="mt-3 font-semibold underline">Try again</button>}
  </div>
);

/**
 * SuccessScreen Component
 * Shows success message after successful property submission or update
 */
const SuccessScreen = React.memo(({ isEditMode = false, onEditComplete, onAddComplete }) => {
  const navigate = useNavigate();

  // Auto-redirect after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditMode && onEditComplete) {
        onEditComplete();
      } else if (!isEditMode && onAddComplete) {
        onAddComplete();
      } else {
        navigate('/admin/properties');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, isEditMode, onEditComplete, onAddComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[9999] p-4 pointer-events-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full animate-in fade-in zoom-in duration-300 pointer-events-auto">
        <div className="mb-6">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Success! ✨</h1>
        <h2 className="text-2xl font-semibold text-green-600 mb-4">
          {isEditMode ? 'Property Updated Successfully' : 'Property Added Successfully'}
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {isEditMode 
            ? 'Your property has been updated and changes are now visible in the property list.'
            : 'Your property has been submitted successfully and is now visible in the property list.'}
        </p>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
          <p className="text-blue-700 font-medium">Redirecting in 3 seconds...</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SuccessScreen] Button clicked');
            if (isEditMode && onEditComplete) {
              console.log('[SuccessScreen] Calling onEditComplete');
              onEditComplete();
            } else if (!isEditMode && onAddComplete) {
              console.log('[SuccessScreen] Calling onAddComplete');
              onAddComplete();
            } else {
              console.log('[SuccessScreen] Navigating to /admin/properties');
              navigate('/admin/properties');
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 cursor-pointer pointer-events-auto"
        >
          {isEditMode ? 'Back to Properties' : 'Go to Properties Now'}
        </button>
      </div>
    </div>
  );
});
SuccessScreen.displayName = 'SuccessScreen';

// ==================== MAIN COMPONENT ====================
/**
 * AddPropertyPage Component
 * Production-ready multi-step property form with complete validation,
 * error handling, localStorage persistence, and API integration
 * Can also be used in edit mode by passing editingProperty prop
 */
const AddPropertyPage = ({ editingProperty, onEditComplete, onAddComplete }) => {
  const navigate = useNavigate();

  // ========== STATE MANAGEMENT ==========
  // Load form with validation or use editing data
  const initialFormData = useMemo(() => {
    try {
      // If editing, use the property data
      if (editingProperty) {
        console.log('[Form Init] Loading property data for editing:', editingProperty.propertyId);
        return {
          basicInfo: {
            propertyId: editingProperty.propertyId || '',
            title: editingProperty.title || '',
            description: editingProperty.description || '',
            propertyType: editingProperty.propertyType || '',
            // Backend may return category/subcategory as a populated object
            // ({ _id, name }) instead of a plain string key. Unwrap it here
            // so dropdowns and the Review step both work correctly.
            category:
              (editingProperty.category && typeof editingProperty.category === 'object'
                ? editingProperty.category.code || editingProperty.category.name || editingProperty.category._id
                : editingProperty.category) || '',
            subcategory:
              (editingProperty.subcategory && typeof editingProperty.subcategory === 'object'
                ? editingProperty.subcategory.name || editingProperty.subcategory._id
                : editingProperty.subcategory) || '',
          },
          location: {
            address: editingProperty.location?.address || '',
            city: editingProperty.location?.city || '',
            state: editingProperty.location?.state || '',
            pincode: editingProperty.location?.pincode || '',
            latitude: editingProperty.location?.latitude ?? null,
            longitude: editingProperty.location?.longitude ?? null,
            landmark: editingProperty.location?.landmark || '',
            locality: editingProperty.location?.locality || '',
          },
          contact: {
            // name/email intentionally omitted per user request
            name: '',
            email: '',
            phone: editingProperty.contact?.phone || '',
          },
          propertyDetails: {
            ...(editingProperty.propertyDetails || {}),
            // Use ?? instead of || so a real value of 0 (e.g. 0 bathrooms)
            // isn't wiped out and shown as blank when editing.
            price: editingProperty.price ?? '',
            area: editingProperty.area ?? '',
            areaUnit: editingProperty.areaUnit || 'sq_ft',
            bedrooms: editingProperty.bedrooms ?? '',
            bathrooms: editingProperty.bathrooms ?? '',
            featured: editingProperty.featured ?? false,
            furnishing:
              editingProperty.rentalInfo?.furnishingStatus ||
              editingProperty.furnishingStatus ||
              editingProperty.propertyDetails?.furnishing ||
              '',
          },
          images: (editingProperty.images || []).map((img, index) => ({
            ...(editingProperty.imageRecords?.[index] || {}),
            preview: '',
            url: img,
            file: null,
            name: img.split('/').pop() || 'image',
          })),
          amenities: editingProperty.amenities || [],
          facilities: editingProperty.facilities || [],
          furnishingItems: editingProperty.furnishingItems || [],
          outdoorFeatures: editingProperty.outdoorFeatures || [],
          resaleInfo: editingProperty.resaleInfo || {},
          rentalInfo: {
            ...(editingProperty.rentalInfo || {}),
            furnishingStatus:
              editingProperty.rentalInfo?.furnishingStatus ||
              editingProperty.furnishingStatus ||
              '',
          },
          commercialDetails: editingProperty.commercialDetails || {},
          newProjectInfo: editingProperty.newProjectInfo || {},
          projectPricing: editingProperty.projectPricing || {},
        };
      }

      // Try to load from localStorage
      const saved = loadFormFromLocalStorage();
      if (saved && validateFormDataShape(saved)) {
        if (usesSupabase) {
          saved.createSessionId ||= createPhotoSession();
          saved.basicInfo.propertyId = 'Assigned on save';
        }
        // Clear images from loaded form since File objects can't be restored from storage
        // Users will need to re-upload images if form is resumed
        console.log('[Form Init] Loaded form from storage, clearing non-serializable images');
        return {
          ...saved,
          images: [], // Clear images - File objects can't be JSON serialized
        };
      }
      cleanCorruptedLocalStorage();
      return usesSupabase ? { ...INITIAL_FORM_STATE, createSessionId: createPhotoSession(), basicInfo: { ...INITIAL_FORM_STATE.basicInfo, propertyId: 'Assigned on save' } } : INITIAL_FORM_STATE;
    } catch (error) {
      console.error('Error loading saved form:', error);
      cleanCorruptedLocalStorage();
      return usesSupabase ? { ...INITIAL_FORM_STATE, createSessionId: createPhotoSession(), basicInfo: { ...INITIAL_FORM_STATE.basicInfo, propertyId: 'Assigned on save' } } : INITIAL_FORM_STATE;
    }
  }, [editingProperty]);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, dispatch] = useReducer(propertyFormReducer, initialFormData, initializePropertyFormState);

  // Generate dynamic steps based on property type
  const FORM_STEPS = useMemo(() => getFormSteps(formData), [formData]);

  // Validate and clamp current step
  const [currentStepRaw, setCurrentStepRaw] = useState(0);
  const currentStep = useMemo(
    () => getValidCurrentStep(currentStepRaw, FORM_STEPS.length),
    [currentStepRaw, FORM_STEPS.length]
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [, setSubmitAttempts] = useState(0);
  const [submissionIssue, setSubmissionIssue] = useState(null);

  // Refs for lifecycle management
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const contentSectionRef = useRef(null);
  const submissionAlertRef = useRef(null);
  const lastFormDataRef = useRef(formData);

  // ========== LIFECYCLE EFFECTS ==========
  // Mark component as mounted, including React Strict Mode effect replays.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-save form to localStorage with debouncing
  useEffect(() => {
    // Only save if form has meaningfully changed
    if (JSON.stringify(formData) !== JSON.stringify(lastFormDataRef.current)) {
      lastFormDataRef.current = formData;
      const saveTimer = setTimeout(() => {
        try {
          saveFormToLocalStorage(formData);
        } catch (error) {
          console.error('Error saving form:', error);
        }
      }, 500); // Debounce saves to avoid excessive writes

      return () => clearTimeout(saveTimer);
    }
  }, [formData]);

  // Clamp currentStep when FORM_STEPS changes
  useEffect(() => {
    const validStep = getValidCurrentStep(currentStepRaw, FORM_STEPS.length);
    if (validStep !== currentStepRaw) {
      setCurrentStepRaw(validStep);
    }
  }, [FORM_STEPS.length, currentStepRaw]);

  // Scroll to top of form when step changes
  useEffect(() => {
    if (contentSectionRef.current) {
      contentSectionRef.current.scrollIntoView(SCROLL_BEHAVIOR);
    }
  }, [currentStep]);

  useEffect(() => {
    if (submissionIssue && submissionAlertRef.current) {
      submissionAlertRef.current.focus({ preventScroll: true });
      submissionAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submissionIssue]);

  // ========== CALLBACKS ==========
  /**
   * Validate current step
   */


  /**
   * Navigate to previous step
   */
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStepRaw((prev) => prev - 1);
      setErrors({});
      setSubmissionIssue(null);
    }
  }, [currentStep]);

  /**
   * Navigate to next step with validation
   */
  const handleNext = useCallback(() => {
    // Move to the next step without running/storing step validation —
    // this keeps every "Next" click frictionless and prevents any step's
    // own error modal from popping up.
    setErrors({});
    setSubmissionIssue(null);
    setCurrentStepRaw((prev) => prev + 1);
  }, []);

  /**
   * Navigate to specific step by clicking step indicator
   */
  const handleStepClick = useCallback(
    (stepIndex) => {
      if (stepIndex <= currentStep) {
        setCurrentStepRaw(stepIndex);
        setErrors({});
        setSubmissionIssue(null);
      }
    },
    [currentStep]
  );

  /**
   * Edit a specific step from review screen
   */
  const handleEdit = useCallback(
    (stepId, keepFieldErrors = false) => {
      const stepIndex = FORM_STEPS.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1 && stepIndex < FORM_STEPS.length) {
        setCurrentStepRaw(stepIndex);
        if (!keepFieldErrors) setErrors({});
        setSubmissionIssue(null);
      }
    },
    [FORM_STEPS]
  );

  /**
   * Submit form with comprehensive error handling
   */
  const handleSubmit = useCallback(async () => {
    // Prevent duplicate submissions
    if (loading || uploadingImages) {
      return;
    }

    // Existing listings can be saved without completing unrelated/missing fields.
    // The API still validates the update against the property schema.
    const validationErrors = editingProperty?._id ? {} : validateCompleteForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmissionIssue({
        message: 'Fix these details before saving.',
        issues: propertyFieldIssues(validationErrors),
      });
      return;
    }

    // Setup submission
    setErrors({});
    setLoading(true);
    setSubmissionIssue(null);
    setSubmitAttempts((prev) => prev + 1);

    let timeout;
    try {
      console.log('[Property Submit] Starting submission...');
      // Create abort controller for request cancellation
      abortControllerRef.current = new AbortController();

      // Get user ID safely
      const userId =
        localStorage.getItem('userId') ||
        localStorage.getItem('user_id') ||
        'admin-user';
      console.log('[Property Submit] User ID:', userId);

      // Transform and validate submission data (images handled separately)
      const submissionData = transformFormDataForSubmission(formData, userId);

      if (!submissionData || typeof submissionData !== 'object') {
        throw new Error('Invalid form data transformation');
      }
      console.log('[Property Submit] Submission data prepared:', {
        title: submissionData.title,
        propertyType: submissionData.propertyType,
        imageCount: formData.images?.length || 0,
      });

      const isEditMode = !!editingProperty?._id;
      let apiCall;
      if (usesSupabase) {
        const body = {
          property: propertyWritePayload(formData, editingProperty?.status || 'available'),
          images: imageReferences(formData.images || []),
          version: isEditMode ? editingProperty.version : null,
          createSessionId: isEditMode ? null : formData.createSessionId,
        };
        apiCall = isEditMode ? propertyService.update(editingProperty._id, body) : propertyService.create(body);
      } else {
        const formPayload = new FormData();
        formPayload.append('property', JSON.stringify(submissionData));
        (formData.images || []).filter(img => img?.file).forEach(img => formPayload.append('images', img.file, img.name));
        apiCall = isEditMode ? propertyService.update(editingProperty._id, formPayload) : propertyService.create(formPayload);
      }

      const response = await Promise.race([
        apiCall,
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Request timeout')), SUBMISSION_TIMEOUT_MS);
        }),
      ]);

      console.log('[Property Submit] Response received:', response?.data);

      // Always clear loading state first
      setLoading(false);

      // Validate response has data - axios wraps response in .data
      if (!response?.data) {
        console.error('[Property Submit] Invalid response structure:', response);
        throw new Error('Invalid server response - no data received');
      }

      // Check if backend indicates success
      const responseData = response.data;
      console.log('[Property Submit] Response data:', responseData);

      // Success handling - cleanup operations (even if component is being unmounted)
      try {
        console.log('[Property Submit] Starting cleanup operations...');
        // Only clear localStorage if not in edit mode
        if (!editingProperty?._id) {
          clearFormFromLocalStorage();
          console.log('[Property Submit] Form cleared from localStorage');
        }
        
        dispatch(createResetFormAction());
        console.log('[Property Submit] Form state reset');
        
        setErrors({});
        console.log('[Property Submit] Errors cleared');
      } catch (cleanupError) {
        console.warn('[Property Submit] Cleanup error (non-blocking):', cleanupError.message);
        // Don't let cleanup errors block success display
      }

      // Display success message - this MUST run even if component is unmounting
      console.log('[Property Submit] Setting submitSuccess to true...');
      setSubmitSuccess(true);
      console.log('[Property Submit] SUCCESS SCREEN SHOULD NOW DISPLAY!');

      // Redirect after delay (or callback for edit mode)
      if (isMountedRef.current) {
        const redirectTimer = setTimeout(() => {
          if (isMountedRef.current) {
            console.log('[Property Submit] Redirecting...');
            if (editingProperty?._id && onEditComplete) {
              console.log('[Property Submit] Calling onEditComplete callback');
              onEditComplete();
            } else {
              navigate('/admin/properties');
            }
          }
        }, 3000);

        // Return cleanup function
        return () => clearTimeout(redirectTimer);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoading(false);
        setSubmissionIssue(propertySubmissionFeedback(error));
      }
    } finally {
      clearTimeout(timeout);
    }
  }, [formData, loading, uploadingImages, editingProperty, navigate, onEditComplete]);

  /**
   * Retry last submission
   */
  const handleRetry = useCallback(() => {
    setSubmissionIssue(null);
    setErrors({});
    handleSubmit();
  }, [handleSubmit]);

  // ========== DERIVED STATE ==========
  const progressPercentage = getFormProgress(formData);
  const CurrentStepComponent = FORM_STEPS[currentStep]?.component;
  const currentStepId = FORM_STEPS[currentStep]?.id || 'basic_info';
  const isReviewStep = currentStepId === 'review';
  const isLastStep = currentStep === FORM_STEPS.length - 1;
  // Next button is always enabled now — user can move to next step without
  // filling all fields. Validation errors (if any) still show as warnings.
  const nextButtonDisabled = false;

  // Log validation errors for debugging
  useEffect(() => {
    if (nextButtonDisabled && Object.keys(errors).length > 0) {
      console.log(`%c[FORM VALIDATION]`, 'color: #ff6b6b; font-weight: bold;', {
        step: currentStepId,
        stepLabel: FORM_STEPS[currentStep]?.label,
        disabled: nextButtonDisabled,
        errors: errors
      });
    }
  }, [nextButtonDisabled, errors, currentStepId, currentStep, FORM_STEPS]);

  // ========== RENDER - SUCCESS SCREEN ==========
  if (submitSuccess) {
    return <SuccessScreen isEditMode={!!editingProperty?._id} onEditComplete={onEditComplete} onAddComplete={onAddComplete} />;
  }

  // ========== RENDER - MAIN FORM ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {editingProperty ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-gray-600">
            {editingProperty 
              ? 'Update your property details. Your progress is auto-saved.'
              : 'Fill in all the details to list your property. Your progress is auto-saved.'}
          </p>
        </div>
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar percentage={progressPercentage} />
          <p className="text-sm text-gray-600 mt-2">
            Form completion: {Math.round(progressPercentage)}%
          </p>
        </div>

        {/* Step Indicators */}
        <StepIndicator
          steps={FORM_STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        {/* Main Content */}
        <div
          ref={contentSectionRef}
          className="bg-white rounded-lg shadow-lg p-8 mb-0"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {FORM_STEPS[currentStep]?.label}
          </h2>

          {/* Render Current Step */}
          {isReviewStep ? (
            <ReviewStep formData={formData} onEdit={handleEdit} />
          ) : CurrentStepComponent ? (
            <CurrentStepComponent
              formData={formData}
              dispatch={dispatch}
              errors={errors}
              isEditMode={!!editingProperty}
              propertyId={editingProperty?._id}
              createSessionId={formData.createSessionId}
              onUploadingChange={setUploadingImages}
            />
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700">
                Error: Step component not found. Please refresh the page.
              </p>
            </div>
          )}
        </div>

        {submissionIssue && (
          <ErrorAlert
            issue={submissionIssue}
            steps={FORM_STEPS}
            onEdit={handleEdit}
            onRetry={handleRetry}
            alertRef={submissionAlertRef}
          />
        )}

        {/* Navigation Buttons - Outside Card */}
        <div className="bg-white rounded-b-lg shadow-lg border-t border-gray-200 px-8 py-6 mt-6 sticky bottom-0 z-40">
          <NavigationButtons
            currentStep={currentStep}
            totalSteps={FORM_STEPS.length}
            onPrev={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            loading={loading || uploadingImages}
            nextButtonDisabled={nextButtonDisabled || (isLastStep && nextButtonDisabled)}
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Your form is automatically saved as you fill it. You can
            close the browser and resume later from where you left off.
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AddPropertyPage);
