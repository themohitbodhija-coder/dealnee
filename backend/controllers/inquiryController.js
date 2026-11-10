const Inquiry = require('../models/Inquiry');

// Create inquiry
exports.createInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, message, property } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      message,
      property: property || null,
    });

    res.status(201).json({
      message: 'Inquiry submitted successfully',
      inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// Get all inquiries (Admin only)
exports.getAllInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;

    const total = await Inquiry.countDocuments(filter);
    const inquiries = await Inquiry.find(filter)
      .populate('property', 'title price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      inquiries,
    });
  } catch (error) {
    next(error);
  }
};

// Get inquiry by ID
exports.getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    ).populate('property', 'title price');

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.status(200).json({
      success: true,
      inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// Update inquiry status (Admin only)
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('property', 'title price');

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.status(200).json({
      message: 'Inquiry status updated successfully',
      inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// Delete inquiry (Admin only)
exports.deleteInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findByIdAndDelete(id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.status(200).json({
      message: 'Inquiry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
