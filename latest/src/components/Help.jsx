import React from "react";
import { Link } from "react-router-dom";
import "./Help.css";

const HelpPage = () => {

  return (
    <>
      {/* Blue Box with Help and Support Title */}
      {/* <div className="header1">
        <h1>Help & Support</h1>
      </div> */}

      {/* FAQ Section */}
      <div className="content1">
        <h2 className="faq-title">Frequently Asked Questions</h2>

        <div className="faq-container">
          <div className="faq-item left">
            <h3>How do I reset my password?</h3>
            <p>
              If you've forgotten your password, go to the login page and click on {" "}
              <Link to="/forgotpassword">Forgot Password?</Link>
            </p>
          </div>

          <div className="faq-item right">
            <h3>How do I contact support?</h3>
            <p>
              You can reach out to our support team by visiting the {""}
              <Link to="/contact">Contact Us</Link> page.
            </p>
          </div>

          <div className="faq-item left">
            <h3>What file formats are supported?</h3>
            <p>
            Our platform supports DOCX (Microsoft Word) ensuring compatibility with most document types and 
            retain the structure and content for accurate analysis.
            </p>
          </div>
        </div>
      </div>
      {/* Additional Help Section */}
      <div className="content additional-help">
        <h2>Need more help?</h2>
        <p>
          If you need additional assistance, please feel free to contact our
          team via the {" "}
          <Link to="/contact">Contact Us</Link> .
        </p>
      </div>
    </>
  );
};

export default HelpPage;
