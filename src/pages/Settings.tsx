import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import {
  SETTINGS_MENU_ITEMS,
  SettingsSectionId,
  ProfileSection,
  PreferencesSection,
  CurrencyRegionSection,
  NotificationsSection,
  DataManagementSection,
  SecuritySection,
} from '@/components/settings';
import { Card } from '@/components/ui/card';
import { ChevronRight, Sparkles } from 'lucide-react';
import { FEATURES } from '@/config/features';
import { aiConfigStorage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as SettingsSectionId) || 'profile';

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() => {
    const validIds: SettingsSectionId[] = [
      'profile',
      'preferences',
      'currency-region',
      'notifications',
      'data-management',
      'security',
    ];
    return validIds.includes(currentTab) ? currentTab : 'profile';
  });

  // AI keys state if feature enabled
  const [openAIKey, setOpenAIKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini'>('openai');

  useEffect(() => {
    if (FEATURES.ENABLE_AI) {
      setOpenAIKey(aiConfigStorage.getOpenAIKey() || '');
      setGeminiKey(aiConfigStorage.getGeminiKey() || '');
      setAiProvider(aiConfigStorage.getProvider());
    }
  }, []);

  const handleSelectSection = (id: SettingsSectionId) => {
    setActiveSection(id);
    setSearchParams({ tab: id });
  };

  const handleSaveAiKeys = () => {
    aiConfigStorage.setProvider(aiProvider);
    aiConfigStorage.setOpenAIKey(openAIKey);
    aiConfigStorage.setGeminiKey(geminiKey);
    toast({
      title: 'AI Settings saved',
      description: 'Your AI provider and API keys have been updated.',
    });
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'preferences':
        return <PreferencesSection />;
      case 'currency-region':
        return <CurrencyRegionSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'data-management':
        return <DataManagementSection />;
      case 'security':
        return <SecuritySection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6">
        {/* Page Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#161F18]">
            Settings
          </h1>
          <p className="text-sm text-[#737E75]">
            Manage your account, preferences, and app settings.
          </p>
        </div>

        {/* 2-Column Responsive Layout: Left Nav Menu & Right Active Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sub-page Menu Navigation (~3.5 cols on desktop) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-2">
            <Card className="rounded-2xl border-[#E2E6DF] bg-white p-2 shadow-sm space-y-1">
              {SETTINGS_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full relative flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-[#EDF8E8] text-[#2C6E20] border border-[#D2ECD0]'
                        : 'text-[#6D776F] hover:text-[#161F18] hover:bg-[#F9FAF8] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#E1F3DB] text-[#2C6E20]'
                            : 'bg-[#F5F6F3] text-[#737E75]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isActive ? 'text-[#161F18]' : 'text-[#2D3748]'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#737E75] truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-[#2C6E20] translate-x-0.5'
                          : 'text-[#9AA59C]'
                      }`}
                    />
                  </button>
                );
              })}
            </Card>

            {/* AI Assistant Settings Card (if enabled by feature flag) */}
            {FEATURES.ENABLE_AI && (
              <Card className="rounded-2xl border-[#E2E6DF] bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#161F18]">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>AI Assistant Keys</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <Label className="text-[11px] text-[#737E75]">Provider</Label>
                    <Select
                      value={aiProvider}
                      onValueChange={(v) => setAiProvider(v as 'openai' | 'gemini')}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-lg mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-[#737E75]">
                      {aiProvider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'}
                    </Label>
                    <Input
                      type="password"
                      placeholder={aiProvider === 'openai' ? 'sk-...' : 'AIza...'}
                      value={aiProvider === 'openai' ? openAIKey : geminiKey}
                      onChange={(e) =>
                        aiProvider === 'openai'
                          ? setOpenAIKey(e.target.value)
                          : setGeminiKey(e.target.value)
                      }
                      className="h-8 text-xs rounded-lg mt-1"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSaveAiKeys}
                    className="w-full bg-[#529E42] hover:bg-[#438235] text-white text-xs h-8 rounded-lg mt-1"
                  >
                    Save API Key
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Dynamic Section Content (~8.5 cols on desktop) */}
          <div className="lg:col-span-8 xl:col-span-9 min-w-0">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
