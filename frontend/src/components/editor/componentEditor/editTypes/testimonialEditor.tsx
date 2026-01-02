"use client";

import { useState } from "react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  src: string;
  alt: string;
}

interface TestimonialEditorProps {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: (index: number) => void;
  setTestimonials: (testimonials: Testimonial[]) => void;
}

const TestimonialEditor = ({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
  setTestimonials,
}: TestimonialEditorProps) => {
  const [tempTestimonial, setTempTestimonial] = useState<Testimonial>(
    testimonials[testimonialIndex] || {
      quote: "",
      name: "",
      role: "",
      company: "",
      src: "",
      alt: "",
    }
  );

  const handleTestimonialChange = (field: keyof Testimonial, value: string) => {
    setTempTestimonial((prev) => ({ ...prev, [field]: value }));
  };

  const saveTestimonial = () => {
    const updated = [...testimonials];
    updated[testimonialIndex] = tempTestimonial;
    setTestimonials(updated);
  };

  const addTestimonial = () => {
    const updated = [...testimonials, tempTestimonial];
    setTestimonials(updated);
    setTestimonialIndex(updated.length - 1);
    setTempTestimonial({
      quote: "",
      name: "",
      role: "",
      company: "",
      src: "",
      alt: "",
    });
  };

  const switchTestimonial = (delta: number) => {
    const newIndex = testimonialIndex + delta;
    if (newIndex >= 0 && newIndex < testimonials.length) {
      setTestimonialIndex(newIndex);
      setTempTestimonial(testimonials[newIndex]);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-md font-semibold">Edit Testimonial {testimonialIndex + 1}</h4>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => switchTestimonial(-1)}
          disabled={testimonialIndex === 0}
          className="text-blue-600 disabled:text-gray-400"
        >
          &lt;
        </button>
        <span>
          {testimonialIndex + 1} / {testimonials.length}
        </span>
        <button
          onClick={() => switchTestimonial(1)}
          disabled={testimonialIndex === testimonials.length - 1}
          className="text-blue-600 disabled:text-gray-400"
        >
          &gt;
        </button>
      </div>

      {/* Fields */}
      <textarea
        value={tempTestimonial.quote}
        onChange={(e) => handleTestimonialChange("quote", e.target.value)}
        placeholder="Quote"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={tempTestimonial.name}
        onChange={(e) => handleTestimonialChange("name", e.target.value)}
        placeholder="Name"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={tempTestimonial.role}
        onChange={(e) => handleTestimonialChange("role", e.target.value)}
        placeholder="Role"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={tempTestimonial.company}
        onChange={(e) => handleTestimonialChange("company", e.target.value)}
        placeholder="Company"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={tempTestimonial.src}
        onChange={(e) => handleTestimonialChange("src", e.target.value)}
        placeholder="Image URL (optional)"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={tempTestimonial.alt}
        onChange={(e) => handleTestimonialChange("alt", e.target.value)}
        placeholder="Alt Text (optional)"
        className="w-full p-2 border border-gray-300 rounded"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={saveTestimonial}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
        <button
          onClick={addTestimonial}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add New
        </button>
      </div>
    </div>
  );
};

export default TestimonialEditor;
