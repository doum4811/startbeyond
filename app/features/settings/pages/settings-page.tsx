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

// 임시 데이터 타입 (스키마 기반으로 추후 수정)
interface UserCategory {
  id: string;
  code: string; // 사용자 정의 코드 (varchar(10))
  label: string;
  icon: string; // 아이콘 식별자 또는 텍스트/이모지
  color: string; // hex color
  isActive: boolean;
  sortOrder: number;
}

interface UserSubcode {
  id: string;
  categoryCode: string; // 상위 카테고리 코드
  subcode: string;
  description: string;
  isFavorite: boolean;
}

const MOCK_USER_CATEGORIES: UserCategory[] = [
  { id: 'cat1', code: 'STUDY', label: '공부하기', icon: '📚', color: '#3b82f6', isActive: true, sortOrder: 1 },
  { id: 'cat2', code: 'WORKOUT', label: '운동하기', icon: '💪', color: '#16a34a', isActive: true, sortOrder: 2 },
  { id: 'cat3', code: 'MEAL_P', label: '식사준비', icon: '🍳', color: '#f97316', isActive: false, sortOrder: 3 },
];

let MOCK_USER_SUBCODES: UserSubcode[] = [
  { id: 'sub1', categoryCode: 'STUDY', subcode: 'React', description: '리액트 심화 학습', isFavorite: true },
  { id: 'sub2', categoryCode: 'STUDY', subcode: 'DB', description: '데이터베이스 설계', isFavorite: false },
  { id: 'sub3', categoryCode: 'WORKOUT', subcode: 'Running', description: '저녁 조깅 30분', isFavorite: true },
  { id: 'sub4', categoryCode: 'EX', subcode: 'Morning Jog', description: '아침 조깅 20분', isFavorite: false }, // 기본코드 EX에 대한 세부코드
];

// 기본 아이콘 풀 (예시)
const ICON_POOL = [
  { id: 'default_book', label: '책', icon: '📚' },
  { id: 'default_fitness', label: '운동', icon: '💪' },
  { id: 'default_code', label: '코딩', icon: '💻' },
  { id: 'default_meeting', label: '회의', icon: '🤝' },
  { id: 'default_food', label: '음식', icon: '🍔' },
  { id: 'default_sleep', label: '수면', icon: '😴' },
  // ... more icons
];

// 기본 코드에 대한 UI 상태를 관리하기 위한 인터페이스 확장
interface UIDefaultCategory {
  code: CategoryCode;
  label: string;
  icon: string;
  isActive: boolean; // 사용자가 토글할 수 있도록
  // 기본 코드는 사용자가 색상이나 순서를 변경할 수 없음
}

// 기본 코드에 대한 UI 상태 (DB 연동 가정)
interface DefaultCodePreference {
  code: CategoryCode;
  label: string;
  icon: string;
  isActive: boolean; // DB에 저장된 사용자별 활성화 상태
}

function UserCategoryForm({ category, onSave, onCancel }: {
  category?: UserCategory | null;
  onSave: (data: Partial<UserCategory>) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(category?.code || '');
  const [label, setLabel] = useState(category?.label || '');
  const [icon, setIcon] = useState(category?.icon || ICON_POOL[0]?.icon || '📝');
  const [isTextIcon, setIsTextIcon] = useState(() => !ICON_POOL.find(i => i.icon === (category?.icon || ICON_POOL[0]?.icon || '📝')));
  const [customIconText, setCustomIconText] = useState(() => isTextIcon ? (category?.icon || '') : '');
  const [color, setColor] = useState(category?.color || '#cccccc');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
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
      setIsActive(category.isActive ?? true);
      setCodeError(''); 
    } else {
        // Reset for new category form
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
    onSave({
      id: category?.id,
      code: code.toUpperCase(),
      label,
      icon: isTextIcon ? customIconText.slice(0,3) : icon,
      color,
      isActive
    });
    onCancel(); // Close dialog on successful save
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label htmlFor="category-code">코드 (영문 대문자, 숫자, _, 최대 10자)</Label>
        <Input id="category-code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 10)); setCodeError(''); }} placeholder="예: MY_STUDY" />
        {codeError && <p className="text-sm text-red-500 pt-1">{codeError}</p>}
      </div>
      <div>
        <Label htmlFor="category-label">레이블 (화면에 표시될 이름)</Label>
        <Input id="category-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 영어 공부" />
      </div>
      <div>
        <Label>아이콘</Label>
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
          <Select value={icon} onValueChange={setIcon}>
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
          <Input id="category-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 p-1" />
          <span className="px-2 py-1 rounded text-sm text-white" style={{ backgroundColor: color }}>{color}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Switch id="category-active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="category-active">활성화 (앱 전체에서 사용)</Label>
      </div>
      <DialogFooter className="pt-6">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={handleSubmit}>{category ? '수정 완료' : '추가'}</Button>
      </DialogFooter>
    </div>
  );
}

function UserSubcodeForm({ subcode, selectedCategoryCode, allCategories, onSave, onCancel }: {
    subcode?: UserSubcode | null;
    selectedCategoryCode: string; // Initially selected category for a new subcode
    allCategories: Array<{ code: string; label: string }>; // For the category dropdown
    onSave: (data: Partial<UserSubcode>) => void;
    onCancel: () => void;
}) {
    const [categoryCode, setCategoryCode] = useState(subcode?.categoryCode || selectedCategoryCode);
    const [currentSubcode, setCurrentSubcode] = useState(subcode?.subcode || '');
    const [description, setDescription] = useState(subcode?.description || '');
    const [isFavorite, setIsFavorite] = useState(subcode?.isFavorite || false);
    const [subcodeError, setSubcodeError] = useState('');

    useEffect(() => {
        if (subcode) {
            setCategoryCode(subcode.categoryCode);
            setCurrentSubcode(subcode.subcode);
            setDescription(subcode.description || '');
            setIsFavorite(subcode.isFavorite || false);
            setSubcodeError('');
        } else {
            setCategoryCode(selectedCategoryCode);
            setCurrentSubcode('');
            setDescription('');
            setIsFavorite(false);
            setSubcodeError('');
        }
    }, [subcode, selectedCategoryCode]);

    const handleSubmit = () => {
        if (!currentSubcode.trim()) {
            setSubcodeError('세부코드 명칭은 필수 항목입니다.');
            return;
        }
        setSubcodeError('');
        onSave({
            id: subcode?.id,
            categoryCode,
            subcode: currentSubcode,
            description,
            isFavorite
        });
        onCancel(); // Close dialog on successful save
    };

    return (
        <div className="space-y-4 py-2">
            <div>
                <Label htmlFor="subcode-category">상위 코드</Label>
                <Select value={categoryCode} onValueChange={setCategoryCode} disabled={!!subcode}> {/*  Cannot change category when editing */}
                    <SelectTrigger id="subcode-category"><SelectValue placeholder="상위 코드 선택" /></SelectTrigger>
                    <SelectContent>
                        {allCategories.map(cat => <SelectItem key={cat.code} value={cat.code}>{cat.label} ({cat.code})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="subcode-code">세부코드 명칭</Label>
                <Input id="subcode-code" value={currentSubcode} onChange={(e) => {setCurrentSubcode(e.target.value); setSubcodeError('');}} placeholder="예: React 강의" />
                {subcodeError && <p className="text-sm text-red-500 pt-1">{subcodeError}</p>}
            </div>
            <div>
                <Label htmlFor="subcode-description">설명 (선택)</Label>
                <Input id="subcode-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="예: Udemy 강의 시청" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <Switch id="subcode-favorite" checked={isFavorite} onCheckedChange={setIsFavorite} />
                <Label htmlFor="subcode-favorite">즐겨찾기 (입력 시 우선 추천)</Label>
            </div>
            <DialogFooter className="pt-6">
                <Button variant="outline" onClick={onCancel}>취소</Button>
                <Button onClick={handleSubmit}>{subcode ? '수정 완료' : '추가'}</Button>
            </DialogFooter>
        </div>
    );
}

export default function SettingsPage() {
  const [userCategories, setUserCategories] = useState<UserCategory[]>(MOCK_USER_CATEGORIES);
  const [userSubcodes, setUserSubcodes] = useState<UserSubcode[]>(MOCK_USER_SUBCODES);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);
  const [isSubcodeFormOpen, setIsSubcodeFormOpen] = useState(false);
  const [editingSubcode, setEditingSubcode] = useState<UserSubcode | null>(null);
  const [selectedCategoryForSubcode, setSelectedCategoryForSubcode] = useState<string>(
    MOCK_USER_CATEGORIES[0]?.code || Object.keys(DEFAULT_CATEGORIES)[0] || ''
  );
  const [showDeactivationAlert, setShowDeactivationAlert] = useState(false);
  const [codeToDeactivate, setCodeToDeactivate] = useState<DefaultCodePreference | null>(null);

  // 기본 코드 상태 관리 (DB 연동 가정)
  const [defaultCodePreferences, setDefaultCodePreferences] = useState<DefaultCodePreference[]>(() =>
    Object.entries(DEFAULT_CATEGORIES).map(([code, cat]) => ({
      code: code as CategoryCode,
      label: cat.label,
      icon: cat.icon,
      isActive: true, // 실제로는 DB에서 가져온 사용자별 활성화 상태여야 함
    }))
  );
  const [isDefaultCategoriesCollapsed, setIsDefaultCategoriesCollapsed] = useState(false);

  // TODO: userCodeSettings state
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);
  const [enableRecommendation, setEnableRecommendation] = useState(true);
  const [recommendationSource, setRecommendationSource] = useState('frequency');

  // --- User Category (Custom Code) Handlers ---
  const handleSaveCategory = (data: Partial<UserCategory>) => {
    if (data.id) {
      setUserCategories(prev => prev.map(cat => cat.id === data.id ? { ...cat, ...data } as UserCategory : cat));
    } else {
      const newId = Math.random().toString(36).slice(2);
      setUserCategories(prev => [...prev, { ...data, id: newId, sortOrder: prev.length + 1 } as UserCategory]);
    }
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = userCategories.find(cat => cat.id === id);
    setUserCategories(prev => prev.filter(cat => cat.id !== id));
    // 사용자 정의 코드 삭제 시, 관련된 세부코드도 삭제
    if (categoryToDelete) {
        setUserSubcodes(prevSubs => prevSubs.filter(sub => sub.categoryCode !== categoryToDelete.code));
    }
  };

  // --- Default Code Preference Handlers ---
  const attemptToggleDefaultCategoryActive = (codePref: DefaultCodePreference) => {
    const numSubcodes = userSubcodes.filter(sc => sc.categoryCode === codePref.code).length;
    if (codePref.isActive && numSubcodes > 0) { // If attempting to deactivate and subcodes exist
        setCodeToDeactivate(codePref);
        setShowDeactivationAlert(true);
    } else { // Activate or deactivate without subcodes
        proceedToggleDefaultCategoryActive(codePref.code);
    }
  };

  const proceedToggleDefaultCategoryActive = (codeToToggle: CategoryCode) => {
    setDefaultCodePreferences(prev =>
        prev.map(cat =>
            cat.code === codeToToggle ? { ...cat, isActive: !cat.isActive } : cat
        )
    );
    setCodeToDeactivate(null); 
    setShowDeactivationAlert(false);
  };

  // --- User Subcode Handlers ---
  const handleSaveSubcode = (data: Partial<UserSubcode>) => {
    if (data.id) { // Edit
      setUserSubcodes(prev => prev.map(sc => sc.id === data.id ? { ...sc, ...data } as UserSubcode : sc));
    } else { // Add
      setUserSubcodes(prev => [...prev, { ...data, id: Math.random().toString(36).slice(2) } as UserSubcode]);
    }
    setIsSubcodeFormOpen(false);
    setEditingSubcode(null);
  };

  const handleDeleteSubcode = (id: string) => {
    setUserSubcodes(prev => prev.filter(sc => sc.id !== id));
  };

  const toggleSubcodeFavorite = (id: string) => {
    setUserSubcodes(prev =>
        prev.map(sc => sc.id === id ? { ...sc, isFavorite: !sc.isFavorite } : sc)
    );
  };

  const allManageableCategories = [
    ...defaultCodePreferences.filter(dc => dc.isActive).map(dc => ({ code: dc.code, label: dc.label })),
    ...userCategories.filter(uc => uc.isActive).map(uc => ({ code: uc.code, label: uc.label }))
  ];

  const filteredSubcodes = selectedCategoryForSubcode ? 
    userSubcodes.filter(sc => sc.categoryCode === selectedCategoryForSubcode) :
    userSubcodes; // 만약 선택된 카테고리 없으면 (이론상으론 항상 있어야 함) 모두 보여주거나, 아예 안보여줄 수도.

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-8">설정</h1>

      <Tabs defaultValue="my-codes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="my-codes">내 코드 관리</TabsTrigger>
          <TabsTrigger value="my-subcodes">내 세부코드 관리</TabsTrigger>
          <TabsTrigger value="input-support">입력 지원</TabsTrigger>
        </TabsList>

        {/* 내 코드 관리 (기본 코드 + 사용자 정의 코드) */}
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
                    <div key={cat.code} className={`flex items-center justify-between p-3 ${index < defaultCodePreferences.length - 1 ? 'border-b' : ''} ${!cat.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-8 h-8 flex items-center justify-center rounded bg-gray-200 text-gray-700">
                          {cat.icon}
                        </span>
                        <div>
                          <div className="font-medium">{cat.label} <span className="text-sm text-muted-foreground">({cat.code})</span></div>
                          {!cat.isActive && <span className="text-xs text-orange-500">현재 비활성 (표시되지 않음)</span>}
                        </div>
                      </div>
                      <Switch checked={cat.isActive} onCheckedChange={() => attemptToggleDefaultCategoryActive(cat)} />
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
                  />
                </DialogContent>
              </Dialog>

              <div className="border rounded-md">
                {userCategories.sort((a,b) => a.sortOrder - b.sortOrder).map((cat, index) => (
                  <div key={cat.id} className={`flex items-center justify-between p-3 ${index < userCategories.length - 1 ? 'border-b' : ''} ${!cat.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      {/* <GripVertical className="cursor-grab opacity-50 mr-1" /> Icon for drag and drop */}
                      <span className="text-2xl w-8 h-8 flex items-center justify-center rounded text-white" style={{ backgroundColor: cat.color }}>{cat.icon}</span>
                      <div>
                        <div className="font-medium">{cat.label} <span className="text-sm text-muted-foreground">({cat.code})</span></div>
                        {!cat.isActive && <span className="text-xs text-red-500">비활성 (앱 전체에 미표시)</span>}
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

        {/* 내 세부코드 관리 */}
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
                            <SelectItem value="ALL_USER_DEFINED">-- 모든 내 코드 --</SelectItem>
                            <SelectItem value="ALL_DEFAULT">-- 모든 기본 코드 --</SelectItem>
                            {defaultCodePreferences.filter(dc => dc.isActive).map(cat => <SelectItem key={cat.code} value={cat.code}>{cat.label} (기본)</SelectItem>)}
                            {userCategories.filter(uc => uc.isActive).map(cat => <SelectItem key={cat.code} value={cat.code}>{cat.label} (사용자)</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Dialog open={isSubcodeFormOpen} onOpenChange={(isOpen) => {
                        setIsSubcodeFormOpen(isOpen);
                        if (!isOpen) setEditingSubcode(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button disabled={!selectedCategoryForSubcode || selectedCategoryForSubcode.startsWith('ALL')} onClick={() => { setEditingSubcode(null); setIsSubcodeFormOpen(true);}}>
                                <PlusCircle className="mr-2 h-4 w-4" /> 새 세부코드 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>{editingSubcode ? '세부코드 수정' : '새 세부코드 추가'}</DialogTitle>
                            <DialogDescription>
                                {selectedCategoryForSubcode && allManageableCategories.find(c => c.code === selectedCategoryForSubcode)?.label} 코드에 대한 세부코드입니다.
                            </DialogDescription>
                        </DialogHeader>
                        <UserSubcodeForm
                            subcode={editingSubcode}
                            selectedCategoryCode={selectedCategoryForSubcode}
                            allCategories={allManageableCategories.filter(c => !c.code.startsWith('ALL'))} // filter out placeholder values
                            onSave={handleSaveSubcode}
                            onCancel={() => { setIsSubcodeFormOpen(false); setEditingSubcode(null); }}
                        />
                        </DialogContent>
                    </Dialog>
                </div>

              <div className="border rounded-md">
                {filteredSubcodes.map((sc, index) => (
                  <div key={sc.id} className={`flex items-center justify-between p-3 ${index < filteredSubcodes.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => toggleSubcodeFavorite(sc.id)} className="mr-1 p-1 h-auto">
                            <Star className={`h-4 w-4 ${sc.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
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
                {filteredSubcodes.length === 0 && selectedCategoryForSubcode && !selectedCategoryForSubcode.startsWith('ALL') && (
                  <p className="p-4 text-center text-muted-foreground">
                    '{allManageableCategories.find(c=>c.code === selectedCategoryForSubcode)?.label}' 코드에 등록된 세부코드가 없습니다.
                  </p>
                )}
                 {(!selectedCategoryForSubcode || selectedCategoryForSubcode.startsWith('ALL')) && (
                     <p className="p-4 text-center text-muted-foreground">세부코드를 보거나 추가하려면 먼저 상위 코드를 선택해주세요.</p>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 입력 지원 설정 */}
        <TabsContent value="input-support">
          <Card>
            <CardHeader>
              <CardTitle>입력 지원 설정</CardTitle>
              <CardDescription>세부코드 입력 시 자동완성 및 추천 기능을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <Label htmlFor="enable-subcode-autocomplete" className="text-base">세부코드 자동완성 기능 사용</Label>
                <Switch id="enable-subcode-autocomplete" checked={enableAutocomplete} onCheckedChange={setEnableAutocomplete} />
              </div>
              <div className="p-4 border rounded-md space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-subcode-recommendation" className="text-base">입력 시 세부코드 추천 사용</Label>
                  <Switch id="enable-subcode-recommendation" checked={enableRecommendation} onCheckedChange={setEnableRecommendation} />
                </div>
                {enableRecommendation && (
                  <div>
                    <Label htmlFor="recommendation-source">세부코드 추천 기준</Label>
                    <Select value={recommendationSource} onValueChange={setRecommendationSource}>
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
            </CardContent>
             <CardFooter>
                <Button onClick={() => console.log('Save input settings:', {enableAutocomplete, enableRecommendation, recommendationSource})}>설정 저장</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Default Code Deactivation Alert */}
      <AlertDialog open={showDeactivationAlert} onOpenChange={setShowDeactivationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기본 코드 비활성화 경고</AlertDialogTitle>
            <AlertDialogDescription>
              '{codeToDeactivate?.label}' ({codeToDeactivate?.code}) 코드를 비활성화하시겠습니까? 
              이 코드에 연결된 사용자 정의 세부코드는 삭제되지 않지만, 이 기본 코드가 비활성화되어 있는 동안에는 숨겨지고 새 항목에 사용할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowDeactivationAlert(false); setCodeToDeactivate(null);}}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => codeToDeactivate && proceedToggleDefaultCategoryActive(codeToDeactivate.code)}>
              비활성화 진행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
} 