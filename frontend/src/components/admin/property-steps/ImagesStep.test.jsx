import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ImagesStep from './ImagesStep';
import { uploadPropertyImage } from '../../../services/photoService';
import { FORM_ACTIONS } from '../../../reducers/propertyFormReducer';

jest.mock('../../../lib/backend', () => ({ usesSupabase: true }));
jest.mock('../../../services/photoService', () => ({
  uploadPropertyImage: jest.fn(),
}));

describe('ImagesStep', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.URL.createObjectURL = jest.fn(() => 'blob:test-preview');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  test('displays existing images with the first image marked as cover and allows setting another image as cover', async () => {
    const dispatch = jest.fn();
    const formData = {
      images: [
        { uploadId: 'id-1', uploadState: 'validated', preview: 'blob:img-1', name: 'photo1.jpg' },
        { uploadId: 'id-2', uploadState: 'validated', preview: 'blob:img-2', name: 'photo2.jpg' },
      ],
    };

    await act(async () => {
      root.render(<ImagesStep formData={formData} dispatch={dispatch} />);
    });

    // Check that cover badge is shown
    expect(container.textContent).toContain('Current Cover');
    expect(container.textContent).toContain('Set as Cover');

    // Click 'Set as Cover' on the second image (index 1)
    const setCoverButtons = [...container.querySelectorAll('button')].filter(
      (b) => b.textContent.includes('Set as Cover')
    );
    expect(setCoverButtons.length).toBe(1);

    await act(async () => {
      setCoverButtons[0].click();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: FORM_ACTIONS.SET_COVER_IMAGE,
      payload: { index: 1 },
    });
  });

  test('calls remove image action and revokes blob URL on delete', async () => {
    const dispatch = jest.fn();
    const formData = {
      images: [
        { uploadId: 'id-1', uploadState: 'validated', preview: 'blob:img-1', name: 'photo1.jpg' },
      ],
    };

    await act(async () => {
      root.render(<ImagesStep formData={formData} dispatch={dispatch} />);
    });

    const removeButton = container.querySelector('button[aria-label="Remove image"]');
    expect(removeButton).toBeTruthy();

    await act(async () => {
      removeButton.click();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: FORM_ACTIONS.REMOVE_IMAGE,
      payload: { index: 0 },
    });
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:img-1');
  });

  test('creates instant preview when file is selected and dispatches final image on upload completion', async () => {
    const dispatch = jest.fn();
    const formData = {
      images: [],
    };

    uploadPropertyImage.mockResolvedValueOnce({
      uploadId: 'new-upload-id',
      uploadState: 'validated',
      url: 'properties/uuid.jpg',
      name: 'new-house.jpg',
      preview: 'blob:test-preview',
    });

    await act(async () => {
      root.render(<ImagesStep formData={formData} dispatch={dispatch} />);
    });

    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'new-house.jpg', { type: 'image/jpeg' });

    await act(async () => {
      const event = { target: { files: [file] } };
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      // Directly invoke the change handler by simulating files selection
      Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(uploadPropertyImage).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ propertyId: null })
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: FORM_ACTIONS.ADD_IMAGE,
      payload: {
        images: [
          expect.objectContaining({
            uploadId: 'new-upload-id',
            uploadState: 'validated',
            name: 'new-house.jpg',
            preview: 'blob:test-preview',
          }),
        ],
      },
    });
  });
});
