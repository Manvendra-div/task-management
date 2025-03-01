import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map(category => category.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a category
router.post('/', async (req, res) => {
  // Check if category already exists
  try {
    const existingCategory = await Category.findOne({ name: req.body.name.toLowerCase() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name: req.body.name.toLowerCase()
    });

    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a category
router.delete('/:name', async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.params.name.toLowerCase() });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    await Category.findByIdAndDelete(category._id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;