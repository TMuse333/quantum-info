"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, Palette, Component, RotateCcw } from 'lucide-react';
import { useComponentEditor } from "@/context/context";
import useWebsiteStore from "@/stores/websiteStore";
import { useEditHistoryStore } from "@/stores/editHistoryStore";
import type { EditableComponent } from '@/types/editorial';
import type { ChatMode, Message, ModeOption } from './types';
import { MODE_OPTIONS } from './constants';
import { COMPONENT_DETAILS_MAP } from './componentDetails';
import MessageBubble from './MessageBubble';
import EditTypeLegend from './EditTypeLegend';
import ComponentSelector from './ComponentSelector';

// Main AI Editor Component
const AIWebsiteEditor: React.FC = () => {
  const {
    currentComponent,
    setCurrentComponent,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    setCurrentColorEdits,
    previewStructuralChanges,
    setPreviewStructuralChanges,
    fileChangeHistory,
    setFileChangeHistory,
  } = useComponentEditor();

  // Get store values reactively
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);
  const websiteData = useWebsiteStore((state) => state.websiteData);

  // Get current page data
  const currentPageData = React.useMemo(() => {
    if (!websiteData?.pages) return null;
    return websiteData.pages[currentPageSlug];
  }, [websiteData, currentPageSlug]);

  const pageComponents = currentPageData?.components;

  const editHistory = useEditHistoryStore();

  // Debug: Check data structure on mount
  React.useEffect(() => {
    if (websiteData) {
      console.log("🔍 [WebsiteAssistant] WebsiteData structure:", {
        hasPages: !!websiteData.pages,
        pagesIsArray: Array.isArray(websiteData.pages),
        pagesIsObject: typeof websiteData.pages === 'object',
        pagesKeys: websiteData.pages ? Object.keys(websiteData.pages) : [],
        currentPageSlug,
        currentPageData,
        componentsCount: pageComponents?.length
      });
    }
  }, [websiteData, currentPageSlug, currentPageData, pageComponents]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ChatMode>(null);
  const [applyToPage, setApplyToPage] = useState(false); // Toggle for page-wide vs single component
  const messageIdCounter = useRef(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Generate unique message ID
  const generateMessageId = () => {
    messageIdCounter.current += 1;
    // Use crypto.randomUUID if available, otherwise use timestamp + counter + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `msg-${Date.now()}-${messageIdCounter.current}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && selectedMode === null) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: `👋 Hi! I'm your AI Website Editor.

What would you like help with? Choose an option below to get started:`,
        timestamp: new Date(),
        metadata: { status: 'success' }
      }]);
    }
  }, [selectedMode]);

  // Track structural changes when fileChangeHistory is updated
  useEffect(() => {
    if (fileChangeHistory.length > 0) {
      const latestChange = fileChangeHistory[fileChangeHistory.length - 1];

      // Check if this entry already exists in edit history (avoid duplicates)
      const existingEntry = editHistory.history.find(
        (entry) => entry.type === 'structural' &&
                   entry.timestamp === latestChange.timestamp &&
                   entry.changes.files?.length === latestChange.files.length
      );

      if (!existingEntry && previewStructuralChanges) {
        editHistory.addEdit({
          type: 'structural',
          pageSlug: currentPageData?.slug || 'index',
          changes: {
            files: latestChange.files.map((file) => ({
              path: file.path,
              action: file.action,
            })),
          },
          metadata: {
            prompt: previewStructuralChanges.originalPrompt,
            llmResponse: previewStructuralChanges.explanation,
            source: 'claude-code',
          },
        });
      }
    }
  }, [fileChangeHistory, previewStructuralChanges, editHistory, currentPageData]);

  // Handle component selection from message bubble
  const handleComponentSelectFromMessage = (component: EditableComponent, mode: ChatMode, messageId: string) => {
    // Set component in context - THIS IS CRITICAL
    setCurrentComponent(component);
    // Set the mode
    setSelectedMode(mode);

    // Update messages: remove selector message and add confirmation
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== messageId);
      const modeOption = MODE_OPTIONS.find(m => m.id === mode);
      return [...filtered, {
        id: generateMessageId(),
        role: 'assistant',
        content: `Perfect! I've selected "${component.name}". ${modeOption?.description ? `\n\n${modeOption.description}` : ''}\n\nWhat would you like to do?`,
        timestamp: new Date(),
        metadata: {
          status: 'success',
          componentName: component.name
        }
      }];
    });
  };

  // Reset mode when closing/reopening
  const handleModeSelect = (mode: ChatMode) => {
    // For colors and text modes, check if component is selected
    if ((mode === 'colors' || mode === 'text') && !currentComponent) {
      // Add message with component selector
      const modeOption = MODE_OPTIONS.find(m => m.id === mode);
      if (modeOption) {
        addMessage({
          role: 'assistant',
          content: `Great! I'll help you with ${modeOption.label.toLowerCase()}. First, please select the component you'd like to edit:`,
          metadata: {
            status: 'success',
            showComponentSelector: true,
            selectorMode: mode
          }
        });
      }
    } else {
      // Proceed normally
      setSelectedMode(mode);
      const modeOption = MODE_OPTIONS.find(m => m.id === mode);
      if (modeOption) {
        addMessage({
          role: 'assistant',
          content: `Great! I'll help you with ${modeOption.label.toLowerCase()}. ${modeOption.description ? `\n\n${modeOption.description}` : ''}\n\nWhat would you like to do?`,
          metadata: { status: 'success' }
        });
      }
    }
  };

  const handleResetMode = () => {
    setSelectedMode(null);
    setApplyToPage(false);
    setMessages([{
      id: generateMessageId(),
      role: 'assistant',
      content: `👋 Hi! I'm your AI Website Editor.

What would you like help with? Choose an option below to get started:`,
      timestamp: new Date(),
      metadata: { status: 'success' }
    }]);
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    setIsLoading(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage
    });

    try {
      // Handle knowledge search modes (general, modify-component, new-component)
      if (selectedMode === 'general' || selectedMode === 'modify-component' || selectedMode === 'new-component') {
        const modeOption = MODE_OPTIONS.find(m => m.id === selectedMode);
        const collection = modeOption?.collection || 'general-website-knowledge';

        addMessage({
          role: 'system',
          content: 'Searching knowledge base...'
        });

        const knowledgeResponse = await fetch('/api/knowledge/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userMessage,
            collection,
            limit: 3,
            sessionId: 'editor-session',
          }),
        });

        if (!knowledgeResponse.ok) {
          throw new Error('Failed to search knowledge base');
        }

        const knowledgeData = await knowledgeResponse.json();

        if (knowledgeData.success && knowledgeData.response) {
          addMessage({
            role: 'assistant',
            content: knowledgeData.response,
            metadata: {
              editType: 'knowledge',
              status: 'success',
              sources: knowledgeData.sources || [],
            }
          });
        } else {
          addMessage({
            role: 'assistant',
            content: "I couldn't find specific information about that. Could you try rephrasing your question?",
            metadata: { status: 'error' }
          });
        }
        setIsLoading(false);
        return;
      }

      // Handle direct edit modes (colors, text) or auto-detect if no mode selected
      if (selectedMode === 'colors') {
        // Check if applying to page or single component
        if (applyToPage) {
          // Page-wide color update
          const state = useWebsiteStore.getState();
          const pageSlug = currentPageData?.slug || 'index';

          // Get all components on current page from websiteData
          const currentPage = websiteData?.pages?.[pageSlug] || null;

          if (!currentPage || !currentPage.components || currentPage.components.length === 0) {
            addMessage({
              role: 'assistant',
              content: '⚠️ No components found on this page.',
              metadata: { status: 'error' }
            });
            setIsLoading(false);
            return;
          }

          // Extract colors from all components
          const componentColors = currentPage.components.map((comp: any) => ({
            id: comp.id,
            type: comp.type,
            currentColors: {
              mainColor: comp.props?.mainColor || "#00bfff",
              textColor: comp.props?.textColor || "#111111",
              baseBgColor: comp.props?.baseBgColor,
              bgLayout: comp.props?.bgLayout || { type: "solid" },
            },
          }));

          addMessage({
            role: 'system',
            content: `Updating colors for ${componentColors.length} components...`
          });

          const pageColorResponse = await fetch("/api/assistant/update-page-colors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: userMessage,
              componentColors: componentColors,
              currentTheme: websiteData?.colorTheme ? {
                primary: websiteData.colorTheme.primary,

                text: websiteData.colorTheme.text,
                background: websiteData.colorTheme.background,
                bgLayout: websiteData.colorTheme.bgLayout,
              } : undefined,
            }),
          });

          if (pageColorResponse.ok) {
            const pageColorData = await pageColorResponse.json();
            const { theme, componentUpdates } = pageColorData;

            // Update all components
            const updateComponentProps = useWebsiteStore.getState().updateComponentProps;
            componentUpdates.forEach((update: any) => {
              updateComponentProps(pageSlug, update.id, update.colors);
            });

            // Update website theme in websiteData
            const currentWebsiteData = useWebsiteStore.getState().websiteData;
            if (currentWebsiteData) {
              useWebsiteStore.getState().setWebsiteData({
                ...currentWebsiteData,
                colorTheme: {
                  primary: theme.primary,
                  text: theme.text,
                  background: theme.background,
                  bgLayout: theme.bgLayout,
                  updatedAt: new Date(),
                  source: "page-wide-update" as const,
                },
              });
            }

            addMessage({
              role: 'assistant',
              content: `🎨 I've updated the color theme across all ${componentUpdates.length} components on this page! The new theme has been saved.`,
              metadata: {
                editType: 'color',
                status: 'success',
                componentName: 'Entire Page'
              }
            });
          } else {
            throw new Error("Failed to update page colors");
          }
          setIsLoading(false);
          return;
        }

        // Single component color update
        if (!currentComponent) {
          addMessage({
            role: 'assistant',
            content: 'Please select a component first to edit colors:',
            metadata: {
              status: 'error',
              showComponentSelector: true,
              selectorMode: 'colors'
            }
          });
          setIsLoading(false);
          return;
        }

        // Get component from page to extract current colors and editableFields
        const pageComponent = pageComponents?.find((c: any) => c.id === currentComponent.id);

        let componentProps = pageComponent?.props || {};

        // Merge with pending text edits if they exist (prevents text from reverting)
        if (LlmCurrentTextOutput && Object.keys(LlmCurrentTextOutput).length > 0) {
          componentProps = { ...componentProps, ...LlmCurrentTextOutput };
        }

        // Extract current colors from component props
        const currentColors = {
          mainColor: componentProps.mainColor || "#00bfff",
          textColor: componentProps.textColor || "#111111",
          baseBgColor: componentProps.baseBgColor,
          bgLayout: componentProps.bgLayout || { type: "solid" },
        };

        // Get editableFields from currentComponent
        const editableFields = currentComponent.editableFields || [];

        console.log("🎨 Color edit - Component:", currentComponent.name);
        console.log("🎨 Color edit - EditableFields:", editableFields);
        console.log("🎨 Color edit - CurrentColors:", currentColors);

        addMessage({
          role: 'system',
          content: 'Updating colors...'
        });

        const colorResponse = await fetch("/api/assistant/update-color", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage,
            editableFields: editableFields,
            currentColors: currentColors,
            currentComponent: {
              name: currentComponent.name,
              id: currentComponent.id,
            },
            pageSlug: currentPageData?.slug || 'index',
          }),
        });

        if (colorResponse.ok) {
          const colorData = await colorResponse.json();
          setCurrentColorEdits(colorData);

          // Track edit history on client side
          const changedProps: Record<string, { old: any; new: any }> = {};
          Object.keys(colorData).forEach((key) => {
            const typedKey = key as keyof typeof currentColors;
            if (JSON.stringify(colorData[key]) !== JSON.stringify(currentColors[typedKey])) {
              changedProps[key] = { old: currentColors[typedKey], new: colorData[key] };
            }
          });

          if (Object.keys(changedProps).length > 0) {
            editHistory.addEdit({
              type: 'color',
              status: 'success',
              componentId: currentComponent.id,
              componentType: currentComponent.name,
              pageSlug: currentPageData?.slug || 'index',
              changes: { props: changedProps },
              metadata: {
                prompt: userMessage,
                source: 'ai-assistant',
                editMode: 'single',
                model: 'gpt-4o-mini',
              },
            });
          }

          addMessage({
            role: 'assistant',
            content: '🎨 I\'ve updated the colors! The changes are applied and ready to save.',
            metadata: {
              editType: 'color',
              status: 'success',
              componentName: currentComponent?.name
            }
          });
        } else {
          throw new Error("Failed to update colors");
        }
        setIsLoading(false);
        return;
      }

      if (selectedMode === 'text') {
        if (!currentComponent) {
          addMessage({
            role: 'assistant',
            content: 'Please select a component first to edit text:',
            metadata: {
              status: 'error',
              showComponentSelector: true,
              selectorMode: 'text'
            }
          });
          setIsLoading(false);
          return;
        }

        addMessage({
          role: 'system',
          content: 'Updating text...'
        });

        // Get current component props for tracking
        // Find component by matching type (case-insensitive) since currentComponent.id doesn't exist
        const pageComponent = pageComponents?.find((c: any) =>
          c.type?.toLowerCase() === currentComponent?.name?.toLowerCase()
        );
        const currentProps = pageComponent?.props || {};
        const componentId = pageComponent?.id;

        if (!componentId) {
          addMessage({
            role: 'assistant',
            content: `⚠️ Error: Could not find component "${currentComponent?.name}" in the current page. Please try selecting the component again.`,
            metadata: { status: 'error' }
          });
          setIsLoading(false);
          return;
        }

        const textResponse = await fetch("/api/assistant/update-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage,
            editableFields: currentComponent?.editableFields || [],
            currentComponent: currentComponent ? {
              name: currentComponent.name,
              id: componentId, // Use the found component ID
            } : undefined,
            pageSlug: currentPageData?.slug || 'index',
            currentProps: currentProps,
          }),
        });

        if (textResponse.ok) {
          const textData = await textResponse.json();
          setLlmCurrentTextOutput(textData);

          // Immediately persist to store to ensure changes are visible
          const updateComponentProps = useWebsiteStore.getState().updateComponentProps;

          if (updateComponentProps && componentId) {
            updateComponentProps(currentPageData?.slug || 'index', componentId, textData);
          }

          // Track edit history on client side
          const changedProps: Record<string, { old: any; new: any }> = {};
          const editableFields = currentComponent?.editableFields || [];

          editableFields.forEach((field) => {
            const oldValue = currentProps[field.key];
            let newValue: any;

            if (field.type === "standardArray" || field.type === "testimonialArray") {
              newValue = textData.array || [];
            } else {
              newValue = textData[field.key as keyof typeof textData];
            }

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              changedProps[field.key] = { old: oldValue, new: newValue };
            }
          });

          if (Object.keys(changedProps).length > 0) {
            editHistory.addEdit({
              type: 'text',
              status: 'success',
              componentId: componentId, // Use the found component ID
              componentType: currentComponent.name,
              pageSlug: currentPageData?.slug || 'index',
              changes: { props: changedProps },
              metadata: {
                prompt: userMessage,
                source: 'ai-assistant',
                editMode: 'single',
                model: 'gpt-4o-mini',
              },
            });
          }

          addMessage({
            role: 'assistant',
            content: '✅ I\'ve updated the text content! The changes are applied and ready to save.',
            metadata: {
              editType: 'text',
              status: 'success',
              componentName: currentComponent?.name
            }
          });
        } else {
          throw new Error("Failed to update text");
        }
        setIsLoading(false);
        return;
      }

      // Auto-detect mode if none selected (original behavior)
      addMessage({
        role: 'system',
        content: 'Analyzing your request...'
      });

      const determineEditResponse = await fetch("/api/assistant/determine-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!determineEditResponse.ok) {
        throw new Error("Failed to determine edit type.");
      }

      const { type, editType, explanation } = await determineEditResponse.json();

      // Add classification message
      addMessage({
        role: 'assistant',
        content: `I understand. I'll help you with a ${type} edit: ${explanation}`,
        metadata: {
          editType: editType || (type === 'structural' ? 'structural' : undefined),
          status: 'pending'
        }
      });

      if (type === "simple") {
        // Handle simple text/color edits (OpenAI)
        if (editType === "text") {
          // Get current component props for tracking
          // Find component by matching type (case-insensitive) since currentComponent.id doesn't exist
          const pageComponent = pageComponents?.find((c: any) =>
            c.type?.toLowerCase() === currentComponent?.name?.toLowerCase()
          );
          const currentProps = pageComponent?.props || {};
          const componentId = pageComponent?.id;

          if (!componentId) {
            addMessage({
              role: 'assistant',
              content: `⚠️ Error: Could not find component "${currentComponent?.name}" in the current page. Please try selecting the component again.`,
              metadata: { status: 'error' }
            });
            setIsLoading(false);
            return;
          }

          // Call text update API
          const textResponse = await fetch("/api/assistant/update-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: userMessage,
              editableFields: currentComponent?.editableFields || [],
              currentComponent: currentComponent ? {
                name: currentComponent.name,
                id: componentId, // Use the found component ID
              } : undefined,
              pageSlug: currentPageData?.slug || 'index',
              currentProps: currentProps,
            }),
          });

          if (textResponse.ok) {
            const textData = await textResponse.json();
            setLlmCurrentTextOutput(textData);

            // Immediately persist to store to ensure changes are visible
            const updateComponentProps = useWebsiteStore.getState().updateComponentProps;

            if (updateComponentProps && componentId) {
              updateComponentProps(currentPageData?.slug || 'index', componentId, textData);
            }

            // Track edit history on client side
            const changedProps: Record<string, { old: any; new: any }> = {};
            const editableFields = currentComponent?.editableFields || [];

            editableFields.forEach((field) => {
              const oldValue = currentProps[field.key];
              let newValue: any;

              if (field.type === "standardArray" || field.type === "testimonialArray") {
                newValue = textData.array || [];
              } else {
                newValue = textData[field.key as keyof typeof textData];
              }

              if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changedProps[field.key] = { old: oldValue, new: newValue };
              }
            });

            if (Object.keys(changedProps).length > 0) {
              editHistory.addEdit({
                type: 'text',
                status: 'success',
                componentId: componentId, // Use the found component ID
                componentType: currentComponent!.name,
                pageSlug: currentPageData?.slug || 'index',
                changes: { props: changedProps },
                metadata: {
                  prompt: userMessage,
                  source: 'ai-assistant',
                  editMode: 'single',
                  model: 'gpt-4o-mini',
                },
              });
            }

            addMessage({
              role: 'assistant',
              content: '✅ I\'ve updated the text content! The changes are applied and ready to save.',
              metadata: {
                editType: 'text',
                status: 'success',
                componentName: currentComponent?.name
              }
            });
          } else {
            throw new Error("Failed to update text");
          }
        } else if (editType === "color") {
          // Get component from page to extract current colors and editableFields
          const pageComponent = pageComponents?.find((c: any) => c.id === currentComponent?.id);
          let componentProps = pageComponent?.props || {};

          // Merge with pending text edits if they exist (prevents text from reverting)
          if (LlmCurrentTextOutput && Object.keys(LlmCurrentTextOutput).length > 0) {
            componentProps = { ...componentProps, ...LlmCurrentTextOutput };
          }

          // Extract current colors from component props
          const currentColors = {
            mainColor: componentProps.mainColor || "#00bfff",
            textColor: componentProps.textColor || "#111111",
            baseBgColor: componentProps.baseBgColor,
            bgLayout: componentProps.bgLayout || { type: "solid" },
          };

          // Get editableFields from currentComponent
          const editableFields = currentComponent?.editableFields || [];

          // Call color update API
          const colorResponse = await fetch("/api/assistant/update-color", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: userMessage,
              editableFields: editableFields,
              currentColors: currentColors,
              currentComponent: currentComponent ? {
                name: currentComponent.name,
                id: currentComponent.id,
              } : undefined,
              pageSlug: currentPageData?.slug || 'index',
            }),
          });

          if (colorResponse.ok) {
            const colorData = await colorResponse.json();
            setCurrentColorEdits(colorData);

            // Track edit history on client side
            const changedProps: Record<string, { old: any; new: any }> = {};
            Object.keys(colorData).forEach((key) => {
              const typedKey = key as keyof typeof currentColors;
              if (JSON.stringify(colorData[key]) !== JSON.stringify(currentColors[typedKey])) {
                changedProps[key] = { old: currentColors[typedKey], new: colorData[key] };
              }
            });

            if (Object.keys(changedProps).length > 0) {
              editHistory.addEdit({
                type: 'color',
                status: 'success',
                componentId: currentComponent!.id,
                componentType: currentComponent!.name,
                pageSlug: currentPageData?.slug || 'index',
                changes: { props: changedProps },
                metadata: {
                  prompt: userMessage,
                  source: 'ai-assistant',
                  editMode: 'single',
                  model: 'gpt-4o-mini',
                },
              });
            }

            addMessage({
              role: 'assistant',
              content: '🎨 I\'ve updated the colors! The changes are applied and ready to save.',
              metadata: {
                editType: 'color',
                status: 'success',
                componentName: currentComponent?.name
              }
            });
          } else {
            throw new Error("Failed to update colors");
          }
        }
      } else if (type === "structural") {
        // Handle structural changes (Claude Code)
        if (!currentComponent) {
          addMessage({
            role: 'assistant',
            content: '⚠️ Please select a component first to make structural changes, or describe the change you want to make across the website.',
            metadata: { status: 'error' }
          });
          setIsLoading(false);
          return;
        }

        const claudeCodeResponse = await fetch("/api/assistant/claude-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage,
            currentComponent: {
              name: currentComponent.name,
              id: currentComponent.id,
            },
            websiteData: websiteData,
          }),
        });

        if (!claudeCodeResponse.ok) {
          const errorData = await claudeCodeResponse.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(`Claude Code API failed: ${errorData.error || errorData.details}`);
        }

        const claudeData = await claudeCodeResponse.json();
        setPreviewStructuralChanges({
          files: claudeData.files,
          preview: claudeData.preview,
          originalPrompt: userMessage,
          explanation: claudeData.explanation,
        });

        addMessage({
          role: 'assistant',
          content: `🔧 I've generated structural changes based on your request. Here's what will be modified:\n\n${claudeData.explanation || claudeData.preview}`,
          metadata: {
            editType: 'structural',
            status: 'preview',
            componentName: currentComponent.name,
            files: claudeData.files.map((f: any) => ({
              path: f.path,
              action: f.action
            }))
          }
        });

        // Show accept/reject buttons in a follow-up message
        addMessage({
          role: 'assistant',
          content: 'Would you like to apply these changes? Click "Accept" to apply them, or "Reject" to cancel.',
          metadata: {
            editType: 'structural',
            status: 'preview'
          }
        });
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      addMessage({
        role: 'assistant',
        content: '⚠️ Oops! Something went wrong. Please try again or rephrase your request.',
        metadata: { status: 'error' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h1 className="text-lg font-bold">AI Website Editor</h1>
              <p className="text-sm text-white/80">
                {selectedMode
                  ? MODE_OPTIONS.find(m => m.id === selectedMode)?.label || 'Tell me what you\'d like to change'
                  : 'Tell me what you\'d like to change'}
              </p>
              {currentComponent && (selectedMode === 'colors' || selectedMode === 'text') && !applyToPage && (
                <p className="text-xs text-white/60 mt-0.5">
                  Editing: {currentComponent.name}
                </p>
              )}
              {selectedMode === 'colors' && applyToPage && (
                <p className="text-xs text-white/60 mt-0.5">
                  Applying to: Entire Page
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedMode === 'colors' && (
              <button
                onClick={() => setApplyToPage(!applyToPage)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                  applyToPage
                    ? 'bg-white/30 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title={applyToPage ? "Switch to single component" : "Apply to entire page"}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">{applyToPage ? 'Page' : 'Component'}</span>
              </button>
            )}
            {currentComponent && (selectedMode === 'colors' || selectedMode === 'text') && !applyToPage && (
              <button
                onClick={() => {
                  addMessage({
                    role: 'assistant',
                    content: 'Select a different component:',
                    metadata: {
                      status: 'success',
                      showComponentSelector: true,
                      selectorMode: selectedMode
                    }
                  });
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-sm"
                title="Change component"
              >
                <Component className="w-4 h-4" />
                <span className="hidden sm:inline">Change</span>
              </button>
            )}
            {selectedMode && (
              <button
                onClick={handleResetMode}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-sm"
                title="Change mode"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Change Mode</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Current Color Theme Display */}
          {websiteData?.colorTheme && (
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Color Theme</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Primary:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: websiteData.colorTheme.primary }}
                    />
                    <span className="text-gray-700">{websiteData.colorTheme.primary}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Main:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: websiteData.colorTheme.primary }}
                    />
                    <span className="text-gray-700">{websiteData.colorTheme.primary}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Text:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: websiteData.colorTheme.text }}
                    />
                    <span className="text-gray-700">{websiteData.colorTheme.text}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Background:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: websiteData.colorTheme.background }}
                    />
                    <span className="text-gray-700">{websiteData.colorTheme.background}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Layout: {websiteData.colorTheme.bgLayout?.type || 'solid'} •
                Updated: {new Date(websiteData.colorTheme.updatedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {/* Mode Selection Buttons - show when no mode selected */}
          {selectedMode === null && messages.length <= 1 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSelect(mode.id)}
                    className={`bg-gradient-to-r ${mode.color} text-white rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-[1.02] text-left group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                        {mode.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{mode.label}</h3>
                        <p className="text-xs text-white/80">{mode.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Help legend - only show when mode selected and at start */}
          {selectedMode !== null && messages.length <= 2 && <EditTypeLegend />}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              pageComponents={pageComponents}
              onComponentSelect={handleComponentSelectFromMessage}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  selectedMode === null
                    ? "Select a mode above to get started..."
                    : selectedMode === 'colors'
                    ? "Describe the color changes you want..."
                    : selectedMode === 'text'
                    ? "Describe the text changes you want..."
                    : selectedMode === 'general'
                    ? "Ask a question about website building..."
                    : selectedMode === 'modify-component'
                    ? "Describe how you want to modify the component..."
                    : selectedMode === 'new-component'
                    ? "Describe the new component you want to create..."
                    : "Tell me what you'd like to change about your website..."
                }
                disabled={isLoading}
                rows={1}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
                style={{ minHeight: '52px', maxHeight: '200px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWebsiteEditor;
