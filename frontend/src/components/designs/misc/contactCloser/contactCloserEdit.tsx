"use client";

import React, { useState } from "react";
import { EditorialComponentProps } from "@/types/editorial";
import { contactCloserDetails, ContactCloserProps } from ".";
import useWebsiteStore from "@/stores/websiteStore";
import { useComponentEditor } from "@/context";
import { handleComponentClick, useSyncColorEdits, useSyncPageDataToComponent } from "@/lib/hooks/hooks";
import { deriveColorPalette } from "@/lib/colorUtils";

const defaultContactCloserProps: ContactCloserProps = {
  title: "Ready to Get Started?",
  description: "Contact us today to discuss your cleaning needs. We're here to help!",
  buttonText: "Get in Touch",
  email: "info@example.com",
  phone: "(123) 456-7890",
  facebookUrl: "",
  mainColor: "#3B82F6",
  textColor: "#000000",
  baseBgColor: "#FFFFFF",
  bgLayout: {
    type: "solid",
  },
};

export const ContactCloserEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<Partial<ContactCloserProps>>({});

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);
  const { currentComponent, setCurrentComponent, setAssistantMessage, currentColorEdits, setCurrentColorEdits } =
    useComponentEditor();

  // Sync component data from store
  useSyncPageDataToComponent(id, "ContactCloser", setComponentProps);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultContactCloserProps, ...componentProps };

  const updateProp = <K extends keyof ContactCloserProps>(
    key: K,
    value: ContactCloserProps[K]
  ) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  const colors = deriveColorPalette(propsWithDefaults, "solid");

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: contactCloserDetails,
      setCurrentComponent,
      setAssistantMessage,
    });

    setCurrentColorEdits({
      textColor: colors.textColor,
      baseBgColor: colors.baseBgColor,
      mainColor: colors.mainColor,
      bgLayout: colors.bgLayout,
    });
  };

  useSyncColorEdits(currentComponent?.name, "ContactCloser", setComponentProps, currentColorEdits);

  return (
    <div onClick={onClick} className="space-y-4 cursor-pointer">
      {/* Preview */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden p-8" style={{ backgroundColor: propsWithDefaults.baseBgColor }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: propsWithDefaults.textColor }}>
          {propsWithDefaults.title}
        </h2>
        <p className="mb-4" style={{ color: propsWithDefaults.textColor }}>
          {propsWithDefaults.description}
        </p>
        <div className="space-y-2">
          <p style={{ color: propsWithDefaults.textColor }}>Email: {propsWithDefaults.email}</p>
          <p style={{ color: propsWithDefaults.textColor }}>Phone: {propsWithDefaults.phone}</p>
        </div>
        <button
          className="mt-4 px-6 py-2 rounded"
          style={{ backgroundColor: propsWithDefaults.mainColor, color: '#fff' }}
        >
          {propsWithDefaults.buttonText}
        </button>
      </div>
    </div>
  );
};

export default ContactCloserEdit;

