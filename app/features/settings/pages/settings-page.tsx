// import { AppSidebar } from "../common/components/app-sidebar";

import { useState, useEffect } from 'react';
import { Button } from '~/common/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import { Label } from '~/common/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/common/components/ui/select';
import { Switch } from '~/common/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/common/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '~/common/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/common/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Palette, Search, GripVertical, Check, X, Star } from 'lucide-react';
import { type CategoryCode, CATEGORIES as DEFAULT_CATEGORIES } from '~/common/types/daily'; // 기본 카테고리 및 타입 임포트
import { useFetcher, Form } from "react-router"; // Added Form, useFetcher
import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "react-router"; // Added ActionFunctionArgs

import * as settingsQueries from "~/features/settings/queries";
import type { 
    UserCategory as DbUserCategory, 
    UserSubcode as DbUserSubcode, 
    UserDefaultCodePreference as DbUserDefaultCodePreference,
    UserCodeSetting as DbUserCodeSetting,
    UserCategoryInsert, 
    UserSubcodeInsert,
    UserDefaultCodePreferenceInsert,
    UserCodeSettingInsert
} from "~/features/settings/queries";

// Helper to get profileId (replace with actual implementation if available)
async function getProfileId(request: Request): Promise<string> {
  // This is a mock. In a real app, you'd get this from session/auth state.
  const loaderData = (request as any).loaderData as SettingsPageLoaderData | undefined;
  if (loaderData?.profileId) return loaderData.profileId;
  // Fallback for actions where loaderData might not be directly on request
  // Consider a more robust way to get profileId in actions if needed
  // return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c"; 
  return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
}

export interface SettingsPageLoaderData {
  userCategories: DbUserCategory[];
  userSubcodes: DbUserSubcode[];
  defaultCodePreferences: DbUserDefaultCodePreference[];
  userCodeSettings: DbUserCodeSetting | null;
  profileId: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: "Code Settings - StartBeyond" },
    { name: "description", content: "Manage your custom categories, subcodes, and default code preferences." },
  ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<SettingsPageLoaderData> {
  const profileId = await getProfileId(request);

  const [userCategoriesData, userSubcodesData, defaultCodePreferencesData, userCodeSettingsData] = await Promise.all([
    settingsQueries.getUserCategories({ profileId }),
    settingsQueries.getAllUserSubcodes({ profileId }), // Fetches all subcodes for the user
    settingsQueries.getUserDefaultCodePreferences({ profileId }),
    settingsQueries.getUserCodeSettings({ profileId })
  ]);

  return {
    profileId,
    userCategories: userCategoriesData || [],
    userSubcodes: userSubcodesData || [],
    defaultCodePreferences: defaultCodePreferencesData || [],
    userCodeSettings: userCodeSettingsData // Can be null if not found
  };
}

export async function action({ request }: ActionFunctionArgs) {
    const profileId = await getProfileId(request);
    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    console.log(`[Settings Action] Intent: ${intent}, Profile ID: ${profileId}`);

    try {
        switch (intent) {
            case "saveUserCategory": {
                const id = formData.get("id") as string | null;
                const code = formData.get("code") as string;
                const label = formData.get("label") as string;
                const icon = formData.get("icon") as string | null;
                const color = formData.get("color") as string | null;
                const isActiveForm = formData.get("is_active");
                const is_active = isActiveForm === "true" || isActiveForm === "on";

                console.log("[Settings Action saveUserCategory] Form Data:", { id, code, label, icon, color, is_active });

                if (!code || !label) {
                    console.error("[Settings Action saveUserCategory] Validation Error: Code and Label are required.");
                    return { ok: false, error: "Code and Label are required.", intent };
                }

                let savedCategory;
                if (id && id !== "undefined") {
                    console.log(`[Settings Action saveUserCategory] Updating category ID: ${id}`);
                    const updates: Partial<Omit<DbUserCategory, "id" | "profile_id" | "created_at" | "updated_at">> =
                        { code, label, icon, color, is_active };
                    savedCategory = await settingsQueries.updateUserCategory({ categoryId: id, profileId, updates });
                } else {
                    console.log("[Settings Action saveUserCategory] Creating new category.");
                    const insertData: UserCategoryInsert = { profile_id: profileId, code, label, icon, color, is_active, sort_order: 0 };
                    console.log("[Settings Action saveUserCategory] Insert data for query:", insertData);
                    savedCategory = await settingsQueries.createUserCategory(insertData);
                    console.log("[Settings Action saveUserCategory] Result from createUserCategory:", savedCategory);
                }
                
                if (!savedCategory) {
                    console.error("[Settings Action saveUserCategory] Failed to save category, query returned no data.");
                    return { ok: false, error: "Failed to save category data to the database.", intent };
                }

                return { ok: true, intent, savedCategory };
            }
            case "deleteUserCategory": {
                const categoryId = formData.get("categoryId") as string;
                if (!categoryId) return { ok: false, error: "Category ID is required.", intent };
                await settingsQueries.deleteUserCategory({ categoryId, profileId });
                return { ok: true, intent, deletedCategoryId: categoryId };
            }
            case "saveUserSubcode": {
                const id = formData.get("id") as string | null;
                const parent_category_code = formData.get("parent_category_code") as string;
                const subcode = formData.get("subcode") as string;
                const description = formData.get("description") as string | null;
                const isFavoriteForm = formData.get("is_favorite");
                const is_favorite = isFavoriteForm === "true" || isFavoriteForm === "on";
                
                if (!parent_category_code || !subcode) return { ok: false, error: "Parent Code and Subcode are required.", intent};

                const subcodeData: Partial<UserSubcodeInsert> = { profile_id: profileId, parent_category_code, subcode, description, is_favorite };

                let savedSubcode;
                if (id && id !== "undefined") {
                     const updates: Partial<Omit<DbUserSubcode, "id" | "profile_id" | "created_at" | "updated_at">> = 
                        { parent_category_code, subcode, description, is_favorite }; // parent_category_code usually not updatable after creation
                    savedSubcode = await settingsQueries.updateUserSubcode({ subcodeId: id, profileId, updates });
                } else {
                    const insertData: UserSubcodeInsert = { profile_id: profileId, parent_category_code, subcode, description, is_favorite, frequency_score: 0 };
                    savedSubcode = await settingsQueries.createUserSubcode(insertData);
                }
                return { ok: true, intent, savedSubcode };
            }
            case "deleteUserSubcode": {
                const subcodeId = formData.get("subcodeId") as string;
                if (!subcodeId) return { ok: false, error: "Subcode ID is required.", intent };
                await settingsQueries.deleteUserSubcode({ subcodeId, profileId });
                return { ok: true, intent, deletedSubcodeId: subcodeId };
            }
            case "toggleSubcodeFavorite": { // This might be better as a specific update action
                const subcodeId = formData.get("subcodeId") as string;
                const currentIsFavorite = formData.get("is_favorite") === "true"; // current state from form
                if (!subcodeId) return { ok: false, error: "Subcode ID is required.", intent };
                
                const updatedSubcode = await settingsQueries.updateUserSubcode({
                    subcodeId,
                    profileId,
                    updates: { is_favorite: !currentIsFavorite }
                });
                return { ok: true, intent, updatedSubcode };
            }
            case "upsertDefaultCodePreference": {
                const default_category_code = formData.get("default_category_code") as CategoryCode;
                const isActiveForm = formData.get("is_active");
                const is_active = isActiveForm === "true" || isActiveForm === "on";

                if (!default_category_code) return { ok: false, error: "Default Category Code is required.", intent };
                
                const preferenceData: UserDefaultCodePreferenceInsert = {
                    profile_id: profileId,
                    default_category_code,
                    is_active
                };
                const upsertedPreference = await settingsQueries.upsertUserDefaultCodePreference(preferenceData);
                return { ok: true, intent, upsertedPreference };
            }
            case "upsertUserCodeSettings": {
                const enableAutocompleteForm = formData.get("enable_autocomplete");
                const enable_autocomplete = enableAutocompleteForm === "true" || enableAutocompleteForm === "on";
                const enableRecommendationForm = formData.get("enable_recommendation");
                const enable_recommendation = enableRecommendationForm === "true" || enableRecommendationForm === "on";
                const recommendation_source = formData.get("recommendation_source") as string || "frequency";

                const settingsData: UserCodeSettingInsert = {
                    profile_id: profileId,
                    enable_autocomplete,
                    enable_recommendation,
                    recommendation_source
                };
                const upsertedSettings = await settingsQueries.upsertUserCodeSettings(settingsData);
                return { ok: true, intent, upsertedSettings };
            }
            default:
                return { ok: false, error: `Unknown intent: ${intent}`, intent };
        }
    } catch (error: any) {
        console.error("Settings Action Error:", error.message, "Intent:", intent);
        return { ok: false, error: error.message || "An unexpected error occurred.", intent };
    }
}


const ICON_POOL = [
  { id: 'default_book', label: '책', icon: '📚' },
  { id: 'default_fitness', label: '운동', icon: '💪' },
  { id: 'default_code', label: '코딩', icon: '💻' },
  { id: 'default_meeting', label: '회의', icon: '🤝' },
  { id: 'default_food', label: '음식', icon: '🍔' },
  { id: 'default_sleep', label: '수면', icon: '😴' },
];

interface DefaultCodePreferenceUI {
    id?: string; // Optional: not present for items not yet in DB
    profile_id?: string; // Optional
    default_category_code: CategoryCode;
    is_active: boolean;
    label: string; 
    icon: string;
    created_at?: string; // Optional
    updated_at?: string; // Optional
}


function UserCategoryForm({ category, onSave, onCancel, profileId }: {
  category?: DbUserCategory | null;
  onSave: (formData: FormData) => void; // Changed to accept FormData
  onCancel: () => void;
  profileId: string; 
}) {
  const [code, setCode] = useState(category?.code || '');
  const [label, setLabel] = useState(category?.label || '');
  const [icon, setIcon] = useState(category?.icon || ICON_POOL[0]?.icon || '📝');
  const [isTextIcon, setIsTextIcon] = useState(() => !ICON_POOL.find(i => i.icon === (category?.icon || ICON_POOL[0]?.icon || '📝')));
  const [customIconText, setCustomIconText] = useState(() => isTextIcon ? (category?.icon || '') : '');
  const [color, setColor] = useState(category?.color || '#cccccc');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (category) {
      setCode(category.code);
      setLabel(category.label);
      const initialIcon = category.icon || ICON_POOL[0]?.icon || '📝';
      setIcon(initialIcon);
      const textIcon = !ICON_POOL.find(i => i.icon === initialIcon);
      setIsTextIcon(textIcon);
      setCustomIconText(textIcon ? initialIcon : '');
      setColor(category.color || '#cccccc');
      setIsActive(category.is_active ?? true);
      setCodeError(''); 
    } else {
        setCode('');
        setLabel('');
        const defaultIcon = ICON_POOL[0]?.icon || '📝';
        setIcon(defaultIcon);
        setIsTextIcon(!ICON_POOL.find(i => i.icon === defaultIcon));
        setCustomIconText('');
        setColor('#cccccc');
        setIsActive(true);
        setCodeError('');
    }
  }, [category]);

  const handleSubmit = () => {
    if (!code.trim()) {
      setCodeError('코드는 필수 항목입니다.');
      return;
    }
    setCodeError('');
    
    const formData = new FormData();
    formData.append("intent", "saveUserCategory");
    if (category?.id) formData.append("id", category.id);
    formData.append("profile_id", profileId); // Ensure profileId is available
    formData.append("code", code.toUpperCase());
    formData.append("label", label);
    formData.append("icon", isTextIcon ? customIconText.slice(0,3) : icon);
    formData.append("color", color);
    formData.append("is_active", isActive.toString());
    // sort_order would be handled by action if necessary

    onSave(formData);
    onCancel(); 
  };

  return (
    // Form structure remains largely the same, ensure names match FormData keys
    <div className="space-y-4 py-2">
      <div>
        <Label htmlFor="category-code">코드 (영문 대문자, 숫자, _, 최대 10자)</Label>
        <Input id="category-code" name="code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 10)); setCodeError(''); }} placeholder="예: MY_STUDY" />
        {codeError && <p className="text-sm text-red-500 pt-1">{codeError}</p>}
      </div>
      <div>
        <Label htmlFor="category-label">레이블 (화면에 표시될 이름)</Label>
        <Input id="category-label" name="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 영어 공부" />
      </div>
      <div>
        <Label>아이콘</Label>
        {/* Icon selection logic is complex for FormData, hidden input for icon might be needed or process in action */}
        <input type="hidden" name="icon_type" value={isTextIcon ? "text" : "select"} />
        <input type="hidden" name="icon_value" value={isTextIcon ? customIconText.slice(0,3) : icon} />

        <div className="flex items-center space-x-2 mb-2">
          <Switch id="text-icon-switch" checked={isTextIcon} onCheckedChange={(checked) => {
            setIsTextIcon(checked);
            if (!checked) setIcon(ICON_POOL[0]?.icon || '📝'); else setCustomIconText('');
          }} />
          <Label htmlFor="text-icon-switch">텍스트/이모지로 아이콘 표현 (최대 3자)</Label>
        </div>
        {isTextIcon ? (
          <Input value={customIconText} onChange={(e) => setCustomIconText(e.target.value)} placeholder="예: PJT, 💡" maxLength={5}/>
        ) : (
          <Select value={icon || undefined} onValueChange={setIcon}>
            <SelectTrigger><SelectValue placeholder="아이콘 선택" /></SelectTrigger>
            <SelectContent>
              {ICON_POOL.map(i => <SelectItem key={i.id} value={i.icon}>{i.icon} {i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label htmlFor="category-color">색상</Label>
        <div className="flex items-center gap-2">
          <Input id="category-color" name="color" type="color" value={color || '#cccccc'} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 p-1" />
          <span className="px-2 py-1 rounded text-sm text-white" style={{ backgroundColor: color || '#cccccc' }}>{color || '#cccccc'}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Switch name="is_active" id="category-active" checked={isActive} onCheckedChange={setIsActive} /> 
        <Label htmlFor="category-active">활성화 (앱 전체에서 사용)</Label>
      </div>
      <DialogFooter className="pt-6">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={handleSubmit}>{category ? '수정 완료' : '추가'}</Button>
      </DialogFooter>
    </div>
  );
}

function UserSubcodeForm({ subcode, selectedCategoryCode, allCategories, onSave, onCancel, profileId }: {
    subcode?: DbUserSubcode | null;
    selectedCategoryCode: string; 
    allCategories: Array<{ code: string; label: string }>; 
    onSave: (formData: FormData) => void; // Changed to accept FormData
    onCancel: () => void;
    profileId: string;
}) {
    const [parentCode, setParentCode] = useState(subcode?.parent_category_code || selectedCategoryCode);
    const [currentSubcodeVal, setCurrentSubcodeVal] = useState(subcode?.subcode || '');
    const [description, setDescription] = useState(subcode?.description || '');
    const [isFavorite, setIsFavorite] = useState(subcode?.is_favorite || false);
    const [subcodeError, setSubcodeError] = useState('');

    useEffect(() => {
        if (subcode) {
            setParentCode(subcode.parent_category_code);
            setCurrentSubcodeVal(subcode.subcode);
            setDescription(subcode.description || '');
            setIsFavorite(subcode.is_favorite || false);
            setSubcodeError('');
        } else {
            setParentCode(selectedCategoryCode); // Ensure this is set for new subcodes
            setCurrentSubcodeVal('');
            setDescription('');
            setIsFavorite(false);
            setSubcodeError('');
        }
    }, [subcode, selectedCategoryCode]);

    const handleSubmit = () => {
        if (!currentSubcodeVal.trim()) {
            setSubcodeError('세부코드 명칭은 필수 항목입니다.');
            return;
        }
        if (!parentCode) { // Should not happen if selectedCategoryCode is always valid
            setSubcodeError('상위 코드를 선택해야 합니다.');
            return;
        }
        setSubcodeError('');
        
        const formData = new FormData();
        formData.append("intent", "saveUserSubcode");
        if (subcode?.id) formData.append("id", subcode.id);
        formData.append("profile_id", profileId);
        formData.append("parent_category_code", parentCode);
        formData.append("subcode", currentSubcodeVal);
        if(description) formData.append("description", description);
        formData.append("is_favorite", isFavorite.toString());

        onSave(formData);
        onCancel();
    };

    return (
        // Form structure remains largely the same, ensure names match FormData keys
        <div className="space-y-4 py-2">
            <div>
                <Label htmlFor="subcode-category">상위 코드</Label>
                <Select name="parent_category_code" value={parentCode} onValueChange={setParentCode} disabled={!!subcode}> 
                    <SelectTrigger id="subcode-category"><SelectValue placeholder="상위 코드 선택" /></SelectTrigger>
                    <SelectContent>
                        {allCategories.map(cat => <SelectItem key={cat.code} value={cat.code}>{cat.label} ({cat.code})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="subcode-code">세부코드 명칭</Label>
                <Input id="subcode-code" name="subcode" value={currentSubcodeVal} onChange={(e) => {setCurrentSubcodeVal(e.target.value); setSubcodeError('');}} placeholder="예: React 강의" />
                {subcodeError && <p className="text-sm text-red-500 pt-1">{subcodeError}</p>}
        </div>
        <div>
                <Label htmlFor="subcode-description">설명 (선택)</Label>
                <Input id="subcode-description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="예: Udemy 강의 시청" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <Switch name="is_favorite" id="subcode-favorite" checked={isFavorite} onCheckedChange={setIsFavorite} />
                <Label htmlFor="subcode-favorite">즐겨찾기 (입력 시 우선 추천)</Label>
            </div>
            <DialogFooter className="pt-6">
                <Button variant="outline" onClick={onCancel}>취소</Button>
                <Button onClick={handleSubmit}>{subcode ? '수정 완료' : '추가'}</Button>
            </DialogFooter>
        </div>
    );
}

export default function SettingsPage({ loaderData }: { loaderData: SettingsPageLoaderData }) {
  const fetcher = useFetcher<typeof action>();
  const { 
    userCategories: initialUserCategories, 
    userSubcodes: initialUserSubcodes, 
    defaultCodePreferences: initialDbDefaultPrefs,
    userCodeSettings: initialUserCodeSettings,
    profileId 
  } = loaderData;

  const [userCategories, setUserCategories] = useState<DbUserCategory[]>(initialUserCategories);
  const [userSubcodes, setUserSubcodes] = useState<DbUserSubcode[]>(initialUserSubcodes);
  
  const [defaultCodePreferences, setDefaultCodePreferences] = useState<DefaultCodePreferenceUI[]>(() => {
    return Object.entries(DEFAULT_CATEGORIES).map(([code, catDetails]) => {
      const dbPref = initialDbDefaultPrefs.find(p => p.default_category_code === code);
      return {
        id: dbPref?.id,
        profile_id: dbPref?.profile_id,
        default_category_code: code as CategoryCode,
        is_active: dbPref ? dbPref.is_active : true, // Default to true if not in DB
        label: catDetails.label,
        icon: catDetails.icon,
        created_at: dbPref?.created_at,
        updated_at: dbPref?.updated_at,
      };
    });
  });

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbUserCategory | null>(null);
  const [isSubcodeFormOpen, setIsSubcodeFormOpen] = useState(false);
  const [editingSubcode, setEditingSubcode] = useState<DbUserSubcode | null>(null);
  
  const [selectedCategoryForSubcode, setSelectedCategoryForSubcode] = useState<string>(() => {
    const activeDefault = defaultCodePreferences.find(dp => dp.is_active);
    if (activeDefault) return activeDefault.default_category_code;
    const activeUser = initialUserCategories.find(uc => uc.is_active);
    if (activeUser) return activeUser.code;
    return Object.keys(DEFAULT_CATEGORIES)[0] || '';
  });

  const [showDeactivationAlert, setShowDeactivationAlert] = useState(false);
  const [codeToDeactivate, setCodeToDeactivate] = useState<DefaultCodePreferenceUI | null>(null);
  const [isDefaultCategoriesCollapsed, setIsDefaultCategoriesCollapsed] = useState(false);

  const [enableAutocomplete, setEnableAutocomplete] = useState(initialUserCodeSettings?.enable_autocomplete ?? true);
  const [enableRecommendation, setEnableRecommendation] = useState(initialUserCodeSettings?.enable_recommendation ?? true);
  const [recommendationSource, setRecommendationSource] = useState(initialUserCodeSettings?.recommendation_source ?? 'frequency');

  useEffect(() => {
    setUserCategories(initialUserCategories);
    setUserSubcodes(initialUserSubcodes);
    setDefaultCodePreferences(
        Object.entries(DEFAULT_CATEGORIES).map(([code, catDetails]) => {
            const dbPref = initialDbDefaultPrefs.find(p => p.default_category_code === code);
            return {
                id: dbPref?.id,
                profile_id: dbPref?.profile_id,
                default_category_code: code as CategoryCode,
                is_active: dbPref ? dbPref.is_active : true,
                label: catDetails.label,
                icon: catDetails.icon,
                created_at: dbPref?.created_at,
                updated_at: dbPref?.updated_at,
            };
        })
    );
    if (initialUserCodeSettings) {
        setEnableAutocomplete(initialUserCodeSettings.enable_autocomplete);
        setEnableRecommendation(initialUserCodeSettings.enable_recommendation);
        setRecommendationSource(initialUserCodeSettings.recommendation_source);
    }
  }, [initialUserCategories, initialUserSubcodes, initialDbDefaultPrefs, initialUserCodeSettings]);


  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
        const data = fetcher.data as { 
            ok: boolean; 
            intent?: string; 
            error?: string; 
            savedCategory?: DbUserCategory;
            deletedCategoryId?: string;
            savedSubcode?: DbUserSubcode;
            deletedSubcodeId?: string;
            updatedSubcode?: DbUserSubcode; // For toggle favorite
            upsertedPreference?: DbUserDefaultCodePreference;
            upsertedSettings?: DbUserCodeSetting;
        };

        if (data.ok) {
            switch (data.intent) {
                case "saveUserCategory":
                    if (data.savedCategory) {
                        setUserCategories(prev => {
                            const index = prev.findIndex(c => c.id === data.savedCategory!.id);
                            if (index !== -1) {
                                const newCategories = [...prev];
                                newCategories[index] = data.savedCategory!;
                                return newCategories;
                            }
                            return [...prev, data.savedCategory!].sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                        });
                    }
                    break;
                case "deleteUserCategory":
                    if (data.deletedCategoryId) {
                        setUserCategories(prev => prev.filter(c => c.id !== data.deletedCategoryId));
                        // Also remove related subcodes locally
                        const categoryToDelete = userCategories.find(cat => cat.id === data.deletedCategoryId);
                        if (categoryToDelete) {
                            setUserSubcodes(prevSubs => prevSubs.filter(sub => sub.parent_category_code !== categoryToDelete.code));
                        }
                    }
                    break;
                case "saveUserSubcode":
                    if (data.savedSubcode) {
                        setUserSubcodes(prev => {
                            const index = prev.findIndex(s => s.id === data.savedSubcode!.id);
                            if (index !== -1) {
                                const newSubcodes = [...prev];
                                newSubcodes[index] = data.savedSubcode!;
                                return newSubcodes;
                            }
                            return [...prev, data.savedSubcode!].sort((a,b) => a.subcode.localeCompare(b.subcode));
                        });
                    }
                    break;
                case "deleteUserSubcode":
                    if (data.deletedSubcodeId) {
                        setUserSubcodes(prev => prev.filter(s => s.id !== data.deletedSubcodeId));
                    }
                    break;
                case "toggleSubcodeFavorite":
                     if (data.updatedSubcode) {
                        setUserSubcodes(prev => prev.map(sc => sc.id === data.updatedSubcode!.id ? data.updatedSubcode! : sc));
                    }
                    break;
                case "upsertDefaultCodePreference":
                    if (data.upsertedPreference) {
                        const pref = data.upsertedPreference;
                        setDefaultCodePreferences(prev => prev.map(p => 
                            p.default_category_code === pref.default_category_code 
                            ? { ...p, is_active: pref.is_active, id: pref.id, profile_id: pref.profile_id, created_at: pref.created_at, updated_at: pref.updated_at } 
                            : p
                        ));
                    }
                    break;
                case "upsertUserCodeSettings":
                    if (data.upsertedSettings) {
                        setEnableAutocomplete(data.upsertedSettings.enable_autocomplete);
                        setEnableRecommendation(data.upsertedSettings.enable_recommendation);
                        setRecommendationSource(data.upsertedSettings.recommendation_source);
                        // Optionally show a success message/toast
                    }
                    break;
            }
        } else if (data.error) {
            console.error("Settings Action Error (from useEffect):", data.error, "Intent:", data.intent);
            // Handle error display, e.g., toast notification
            alert(`Error: ${data.error}`);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, fetcher.state]);


  const handleSaveCategory = (formData: FormData) => {
    fetcher.submit(formData, { method: "post" });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm("이 사용자 정의 코드를 삭제하시겠습니까? 관련된 세부코드들도 함께 삭제될 수 있습니다.")) {
        const formData = new FormData();
        formData.append("intent", "deleteUserCategory");
        formData.append("categoryId", categoryId);
        fetcher.submit(formData, { method: "post" });
    }
  };
  
  const attemptToggleDefaultCategoryActive = (codePref: DefaultCodePreferenceUI) => {
    const numSubcodes = userSubcodes.filter(sc => sc.parent_category_code === codePref.default_category_code).length;
    if (codePref.is_active && numSubcodes > 0) { 
        setCodeToDeactivate(codePref);
        setShowDeactivationAlert(true);
    } else { 
        const formData = new FormData();
        formData.append("intent", "upsertDefaultCodePreference");
        formData.append("default_category_code", codePref.default_category_code);
        formData.append("is_active", (!codePref.is_active).toString());
        fetcher.submit(formData, { method: "post"});
    }
  };

  const proceedToggleDefaultCategoryActive = (codeToToggle: CategoryCode) => {
    const codePref = defaultCodePreferences.find(p => p.default_category_code === codeToToggle);
    if (codePref) {
        const formData = new FormData();
        formData.append("intent", "upsertDefaultCodePreference");
        formData.append("default_category_code", codeToToggle);
        formData.append("is_active", (!codePref.is_active).toString());
        fetcher.submit(formData, { method: "post"});
    }
    setCodeToDeactivate(null); 
    setShowDeactivationAlert(false);
  };

  const handleSaveSubcode = (formData: FormData) => {
    fetcher.submit(formData, { method: "post" });
  };

  const handleDeleteSubcode = (subcodeId: string) => {
     if (confirm("이 세부코드를 삭제하시겠습니까?")) {
        const formData = new FormData();
        formData.append("intent", "deleteUserSubcode");
        formData.append("subcodeId", subcodeId);
        fetcher.submit(formData, { method: "post" });
    }
  };

  const toggleSubcodeFavorite = (subcodeId: string, currentIsFavorite: boolean) => {
    const formData = new FormData();
    formData.append("intent", "toggleSubcodeFavorite");
    formData.append("subcodeId", subcodeId);
    formData.append("is_favorite", currentIsFavorite.toString());
    fetcher.submit(formData, { method: "post" });
  };
  
  const handleSaveInputSettings = () => {
    const formData = new FormData();
    formData.append("intent", "upsertUserCodeSettings");
    formData.append("enable_autocomplete", enableAutocomplete.toString());
    formData.append("enable_recommendation", enableRecommendation.toString());
    formData.append("recommendation_source", recommendationSource);
    fetcher.submit(formData, { method: "post"});
    // alert("입력 지원 설정이 저장되었습니다."); // Optimistic, or handle in useEffect
  };


  const allManageableCategories = [
    ...defaultCodePreferences.filter(dc => dc.is_active).map(dc => ({ code: dc.default_category_code, label: dc.label })),
    ...userCategories.filter(uc => uc.is_active).map(uc => ({ code: uc.code, label: uc.label }))
  ];

  const filteredSubcodes = selectedCategoryForSubcode && !selectedCategoryForSubcode.startsWith('ALL_') ? 
    userSubcodes.filter(sc => sc.parent_category_code === selectedCategoryForSubcode) :
    (selectedCategoryForSubcode === 'ALL_USER_DEFINED' ? userSubcodes.filter(sc => userCategories.some(uc => uc.code === sc.parent_category_code && uc.is_active)) : 
    (selectedCategoryForSubcode === 'ALL_DEFAULT' ? userSubcodes.filter(sc => defaultCodePreferences.some(dc => dc.default_category_code === sc.parent_category_code && dc.is_active)) : 
    [])); // Default to empty if no specific category or "ALL" variant is chosen correctly.

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-8">설정</h1>

      <Tabs defaultValue="my-codes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="my-codes">내 코드 관리</TabsTrigger>
          <TabsTrigger value="my-subcodes">내 세부코드 관리</TabsTrigger>
          <TabsTrigger value="input-support">입력 지원</TabsTrigger>
        </TabsList>

        <TabsContent value="my-codes">
          <Card className="mb-6">
            <CardHeader className="cursor-pointer" onClick={() => setIsDefaultCategoriesCollapsed(!isDefaultCategoriesCollapsed)}>
              <div className="flex justify-between items-center">
                <CardTitle>기본 코드</CardTitle>
                <Button variant="ghost" size="sm">
                  {isDefaultCategoriesCollapsed ? '펴기' : '접기'}
                </Button>
              </div>
              <CardDescription>앱에서 기본으로 제공하는 코드입니다. 활성/비활성 상태를 변경하여 앱 내 표시 여부를 제어합니다. (데이터는 보존됨)</CardDescription>
            </CardHeader>
            {!isDefaultCategoriesCollapsed && (
              <CardContent>
                <div className="border rounded-md">
                  {defaultCodePreferences.map((cat, index) => (
                    <div key={cat.default_category_code} className={`flex items-center justify-between p-3 ${index < defaultCodePreferences.length - 1 ? 'border-b' : ''} ${!cat.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-8 h-8 flex items-center justify-center rounded bg-gray-200 text-gray-700">
                          {cat.icon}
                        </span>
                        <div>
                          <div className="font-medium">{cat.label} <span className="text-sm text-muted-foreground">({cat.default_category_code})</span></div>
                          {!cat.is_active && <span className="text-xs text-orange-500">현재 비활성 (표시되지 않음)</span>}
                        </div>
                      </div>
                      <Switch checked={cat.is_active} onCheckedChange={() => attemptToggleDefaultCategoryActive(cat)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>사용자 정의 코드 관리</CardTitle>
              <CardDescription>새로운 코드를 추가, 수정, 삭제하고 순서를 변경할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isCategoryFormOpen} onOpenChange={(isOpen) => {
                setIsCategoryFormOpen(isOpen);
                if (!isOpen) setEditingCategory(null);
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingCategory(null); setIsCategoryFormOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> 새 사용자 코드 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? '사용자 코드 수정' : '새 사용자 코드 추가'}</DialogTitle>
                  </DialogHeader>
                  <UserCategoryForm
                    category={editingCategory}
                    onSave={handleSaveCategory}
                    onCancel={() => { setIsCategoryFormOpen(false); setEditingCategory(null); }}
                    profileId={profileId}
                  />
                </DialogContent>
              </Dialog>

              <div className="border rounded-md">
                {userCategories.sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((cat, index) => (
                  <div key={cat.id} className={`flex items-center justify-between p-3 ${index < userCategories.length - 1 ? 'border-b' : ''} ${!cat.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-8 h-8 flex items-center justify-center rounded text-white" style={{ backgroundColor: cat.color || '#cccccc' }}>{cat.icon}</span>
                      <div>
                        <div className="font-medium">{cat.label} <span className="text-sm text-muted-foreground">({cat.code})</span></div>
                        {!cat.is_active && <span className="text-xs text-red-500">비활성 (앱 전체에 미표시)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => { setEditingCategory(cat); setIsCategoryFormOpen(true);}}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {userCategories.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground">사용자 정의 코드가 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-subcodes">
          <Card>
            <CardHeader>
              <CardTitle>내 세부코드 관리</CardTitle>
              <CardDescription>자주 사용하는 세부코드를 코드별로 관리합니다. 여기서 즐겨찾기한 세부코드는 입력 시 우선 추천됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                    <Select value={selectedCategoryForSubcode} onValueChange={setSelectedCategoryForSubcode}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="세부코드를 관리할 코드 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_USER_DEFINED">-- 모든 내 사용자 코드 --</SelectItem>
                            <SelectItem value="ALL_DEFAULT">-- 모든 기본 코드 --</SelectItem>
                            {defaultCodePreferences.filter(dc => dc.is_active).map(cat => <SelectItem key={cat.default_category_code} value={cat.default_category_code}>{cat.label} (기본)</SelectItem>)}
                            {userCategories.filter(uc => uc.is_active).map(cat => <SelectItem key={cat.code} value={cat.code}>{cat.label} (사용자)</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Dialog open={isSubcodeFormOpen} onOpenChange={(isOpen) => {
                        setIsSubcodeFormOpen(isOpen);
                        if (!isOpen) setEditingSubcode(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button disabled={!selectedCategoryForSubcode || selectedCategoryForSubcode.startsWith('ALL_')} onClick={() => { setEditingSubcode(null); setIsSubcodeFormOpen(true);}}>
                                <PlusCircle className="mr-2 h-4 w-4" /> 새 세부코드 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>{editingSubcode ? '세부코드 수정' : '새 세부코드 추가'}</DialogTitle>
                            <DialogDescription>
                                {selectedCategoryForSubcode && !selectedCategoryForSubcode.startsWith('ALL_') && allManageableCategories.find(c => c.code === selectedCategoryForSubcode)?.label} 코드에 대한 세부코드입니다.
                            </DialogDescription>
                        </DialogHeader>
                        <UserSubcodeForm
                            subcode={editingSubcode}
                            selectedCategoryCode={selectedCategoryForSubcode}
                            allCategories={allManageableCategories.filter(c => !c.code.startsWith('ALL_'))}
                            onSave={handleSaveSubcode}
                            onCancel={() => { setIsSubcodeFormOpen(false); setEditingSubcode(null); }}
                            profileId={profileId}
                        />
                        </DialogContent>
                    </Dialog>
                </div>

              <div className="border rounded-md">
                {filteredSubcodes.map((sc, index) => (
                  <div key={sc.id} className={`flex items-center justify-between p-3 ${index < filteredSubcodes.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => toggleSubcodeFavorite(sc.id, sc.is_favorite)} className="mr-1 p-1 h-auto">
                            <Star className={`h-4 w-4 ${sc.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      <div>
                        <div className="font-medium">{sc.subcode}</div>
                        {sc.description && <p className="text-sm text-muted-foreground">{sc.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => { setEditingSubcode(sc); setIsSubcodeFormOpen(true);}}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteSubcode(sc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredSubcodes.length === 0 && selectedCategoryForSubcode && !selectedCategoryForSubcode.startsWith('ALL_') && (
                  <p className="p-4 text-center text-muted-foreground">
                    '{allManageableCategories.find(c=>c.code === selectedCategoryForSubcode)?.label}' 코드에 등록된 세부코드가 없습니다.
                  </p>
                )}
                 {(!selectedCategoryForSubcode || selectedCategoryForSubcode.startsWith('ALL_')) && (
                     <p className="p-4 text-center text-muted-foreground">세부코드를 보거나 추가하려면 먼저 상위 코드를 선택해주세요.</p>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input-support">
          <Card>
            <CardHeader>
              <CardTitle>입력 지원 설정</CardTitle>
              <CardDescription>세부코드 입력 시 자동완성 및 추천 기능을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form method="post" onSubmit={(e) => { e.preventDefault(); handleSaveInputSettings();}}>
                    <input type="hidden" name="intent" value="upsertUserCodeSettings" />
                    <div className="flex items-center justify-between p-4 border rounded-md">
                        <Label htmlFor="enable-subcode-autocomplete" className="text-base">세부코드 자동완성 기능 사용</Label>
                        <Switch name="enable_autocomplete" id="enable-subcode-autocomplete" checked={enableAutocomplete} onCheckedChange={setEnableAutocomplete} />
                    </div>
                    <div className="p-4 border rounded-md space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                        <Label htmlFor="enable-subcode-recommendation" className="text-base">입력 시 세부코드 추천 사용</Label>
                        <Switch name="enable_recommendation" id="enable-subcode-recommendation" checked={enableRecommendation} onCheckedChange={setEnableRecommendation} />
                        </div>
                        {enableRecommendation && (
                        <div>
                            <Label htmlFor="recommendation-source">세부코드 추천 기준</Label>
                            <Select name="recommendation_source" value={recommendationSource} onValueChange={setRecommendationSource}>
                            <SelectTrigger id="recommendation-source" className="w-[280px]">
                                <SelectValue placeholder="추천 기준 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="frequency">자주 사용한 순서</SelectItem>
                                <SelectItem value="favorite">즐겨찾기 한 순서</SelectItem>
                                <SelectItem value="recent">최근 사용 순서</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                        )}
                    </div>
                    <CardFooter className="mt-6">
                        <Button type="submit">입력 지원 설정 저장</Button>
                    </CardFooter>
                </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={showDeactivationAlert} onOpenChange={setShowDeactivationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기본 코드 비활성화 경고</AlertDialogTitle>
            <AlertDialogDescription>
              '{codeToDeactivate?.label}' ({codeToDeactivate?.default_category_code}) 코드를 비활성화하시겠습니까? 
              이 코드에 연결된 사용자 정의 세부코드는 삭제되지 않지만, 이 기본 코드가 비활성화되어 있는 동안에는 숨겨지고 새 항목에 사용할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowDeactivationAlert(false); setCodeToDeactivate(null);}}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => codeToDeactivate && proceedToggleDefaultCategoryActive(codeToDeactivate.default_category_code)}>
              비활성화 진행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
} 