// Author: Member 2 - Booking Management Module
import { useEffect, useState } from "react";
import { createBooking } from "./bookingApi";

const initialFormState = {
  resourceId: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: ""
};

function BookingForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!successMessage && !errorMessage) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        resourceId: formData.resourceId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        expectedAttendees: formData.expectedAttendees
          ? Number(formData.expectedAttendees)
          : null
      };

      await createBooking(payload);
      setSuccessMessage("Booking request submitted successfully!");
      setFormData(initialFormState);
    } catch (error) {
      if (error?.response?.status === 409) {
        setErrorMessage(
          "This resource is already booked for the selected time. Please choose a different slot."
        );
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="ops-panel booking-card mx-auto max-w-3xl border-l-4 border-l-[#0a6665]">
      <div className="ops-panel-head">
        <h2>Create Booking</h2>
      </div>

      {successMessage ? (
        <div className="booking-alert booking-alert-success">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="booking-alert booking-alert-error">
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="booking-form space-y-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="resourceId" className="booking-label">
            Resource ID
          </label>
          <input
            id="resourceId"
            name="resourceId"
            value={formData.resourceId}
            onChange={handleChange}
            type="text"
            required
            placeholder="Resource ID"
            className="booking-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="startTime" className="booking-label">
            Start Time
          </label>
          <input
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            type="datetime-local"
            required
            className="booking-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="endTime" className="booking-label">
            End Time
          </label>
          <input
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            type="datetime-local"
            required
            className="booking-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="purpose" className="booking-label">
            Purpose
          </label>
          <input
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            type="text"
            required
            placeholder="Purpose"
            className="booking-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expectedAttendees" className="booking-label">
            Expected Attendees (Optional)
          </label>
          <input
            id="expectedAttendees"
            name="expectedAttendees"
            value={formData.expectedAttendees}
            onChange={handleChange}
            type="number"
            min="1"
            placeholder="Expected attendees (optional)"
            className="booking-input"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="booking-primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Booking"}
        </button>
      </form>
    </article>
  );
}

export default BookingForm;
