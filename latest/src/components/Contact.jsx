import React, { useState } from "react";
import "./Contact.css";
import emailjs from "emailjs-com";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, email, phone, message } = formData;

    // Validate required fields
    if (!name || !email || !message) {
      alert("Please fill out all required fields.");
      return;
    }

    // Prepare the email parameters
    const emailParams = {
      from_name: name,
      from_email: email,
      phone_number: phone || "Not provided",
      message,
    };

    // Send email via EmailJS
    emailjs
      .send(
        EMAILJS_SERVICE_ID, // Replace with your EmailJS Service ID
        EMAILJS_TEMPLATE_ID, // Replace with your EmailJS Template ID
        emailParams,
        EMAILJS_PUBLIC_KEY // Replace with your valid EmailJS Public Key
      )
      .then(
        (response) => {
          console.log("Email sent successfully:", response);
          alert("Your message has been sent successfully!");
          setFormData({
            name: "",
            email: "",
            phone: "",
            message: "",
          });
        },
        (error) => {
          console.error("Email sending error:", error);
          if (error.status === 400) {
            alert(
              "Failed to send the message. It seems your public key is invalid. Please verify your EmailJS credentials."
            );
          } else {
            alert("Failed to send the message. Please try again later.");
          }
        }
      );
  };

  return (
    <div className="contact-container">
      <h1>Contact Us</h1>
      <p>If you have any questions, feel free to reach out to us!</p>
      <form id="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            pattern="[0-9]{10}"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            rows="4"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <button type="submit" className="btn">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Contact;
