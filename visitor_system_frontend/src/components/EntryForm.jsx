import { useState } from 'react';
import axios from 'axios';

function EntryForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/visitors/entry', formData);
      setSuccess(response.data.message);
      
      // Reset form after successful submission
      setFormData({
        name: '',
        phone: '',
        purpose: ''
      });
      
      setLoading(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (error) {
      setLoading(false);
      console.error('Error submitting entry request:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Error submitting entry request. Please try again.');
      }
    }
  };

  return (
    <div className="container">
      <h2>Visitor Entry Form</h2>
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input 
            type="text" 
            id="name"
            name="name"
            placeholder="Enter your full name" 
            value={formData.name} 
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone"
            name="phone"
            placeholder="Enter your 10-digit phone number" 
            value={formData.phone} 
            onChange={handleChange}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="purpose">Purpose of Visit</label>
          <input 
            type="text" 
            id="purpose"
            name="purpose"
            placeholder="Enter purpose of visit" 
            value={formData.purpose} 
            onChange={handleChange}
            className={errors.purpose ? 'error' : ''}
          />
          {errors.purpose && <span className="error-message">{errors.purpose}</span>}
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default EntryForm;