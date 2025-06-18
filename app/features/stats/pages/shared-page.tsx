import React from 'react';
import { type LoaderFunctionArgs, type MetaFunction, useLoaderData, Link } from 'react-router';
import { makeSSRClient } from '~/supa-client';
import * as statsQueries from '~/features/stats/queries';
import * as settingsQueries from '~/features/settings/queries';
import type { SharedLink, SummaryPageLoaderData, AdvancedPageLoaderData } from '~/features/stats/types';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '~/common/components/ui/card';
import { Button } from '~/common/components/ui/button';
import { CategoryDistributionList } from '../components/CategoryDistributionList';
import { SubcodeDistributionList } from '../components/SubcodeDistributionList';
import { CATEGORIES, type UICategory } from '~/common/types/daily';
import { DateTime } from 'luxon';

// This will hold data for ANY shared page type.
interface SharedPageLoaderData {
  sharedLink: SharedLink;
  summaryData?: Partial<Omit<SummaryPageLoaderData, 'profileId' | 'locale' | 'sharedLink'>>;
  advancedData?: Partial<Omit<AdvancedPageLoaderData, 'profileId' | 'locale' | 'sharedLink'>>;
  // categoryData?: ...
}

export const loader = async ({ params, request }: LoaderFunctionArgs): Promise<SharedPageLoaderData> => {
  const { token } = params;
  if (!token) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const { client } = makeSSRClient(request);
  // @ts-ignore
  const sharedLink = await statsQueries.getSharedLinkByToken(client, { token });

  if (!sharedLink) {
    throw new Response("Not Found", { status: 404 });
  }

  // Based on page_type, fetch the corresponding data
  if (sharedLink.page_type === 'summary') {
    const profileId = sharedLink.profile_id;
    const monthForDb = sharedLink.period;
    const selectedMonthStart = DateTime.fromISO(`${monthForDb}-01`).startOf("month");
    const selectedMonthEnd = selectedMonthStart.endOf("month");

    const [
      categoryDistribution,
      subcodeDistribution,
      userCategoriesData,
    ] = await Promise.all([
      statsQueries.calculateCategoryDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
      }),
      statsQueries.calculateSubcodeDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
      }),
      settingsQueries.getUserCategories(client, { profileId }),
    ]);

    const categoryDistributionWithPercentage = (() => {
        if (!categoryDistribution || categoryDistribution.length === 0) return [];
        const totalDuration = categoryDistribution.reduce((sum, item) => sum + item.duration, 0);
        if (totalDuration === 0) return categoryDistribution.map(item => ({...item, percentage: 0}));
        return categoryDistribution.map(item => ({
          ...item,
          percentage: Math.round((item.duration / totalDuration) * 100),
        }));
    })();
      
    const processedCategories: UICategory[] = [];
    Object.values(CATEGORIES).forEach(baseCategory => {
        processedCategories.push({ ...baseCategory, isCustom: false, isActive: true, sort_order: baseCategory.sort_order || 999 });
    });

    userCategoriesData.forEach(userCat => {
        const existingIndex = processedCategories.findIndex(c => c.code === userCat.code && !c.isCustom);
        if (existingIndex !== -1) {
            processedCategories.splice(existingIndex, 1);
        }
        processedCategories.push({
            code: userCat.code,
            label: userCat.label,
            icon: userCat.icon || '📝',
            color: userCat.color || undefined,
            isCustom: true,
            isActive: userCat.is_active,
            hasDuration: true,
            sort_order: userCat.sort_order ?? 1000,
        });
    });
    processedCategories.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));


    return {
      // @ts-ignore
      sharedLink,
      summaryData: {
        selectedMonthISO: monthForDb,
        categoryDistribution: categoryDistributionWithPercentage,
        subcodeDistribution,
        categories: processedCategories,
      },
    };
  }

  // Fallback for other page types
  // @ts-ignore
  return { sharedLink };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const { t } = useTranslation();
    const pageData = data as SharedPageLoaderData | undefined;
    const pageType = pageData?.sharedLink?.page_type || 'Stats';
    
    return [
      { title: t('shared_page.meta_title', { pageType: pageType.charAt(0).toUpperCase() + pageType.slice(1) }) },
      { name: "description", content: t('shared_page.meta_description') },
    ];
};

export default function SharedPage() {
  const { sharedLink } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  if (!sharedLink) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('shared_page.not_found')}</p>
      </div>
    );
  }
  
  const loaderData = useLoaderData<typeof loader>();

  const renderContent = () => {
    if (sharedLink.page_type === 'summary' && loaderData.summaryData) {
        const { settings } = sharedLink;
        // @ts-ignore
        const { include_summary, include_subcode_distribution } = settings;
        const { categoryDistribution, subcodeDistribution, categories } = loaderData.summaryData;

        return (
            <div className="space-y-6">
                {include_summary && (
                    <Card>
                        <CardHeader><CardTitle>{t('stats_summary_page.category_distribution')}</CardTitle></CardHeader>
                        <CardContent>
                            {categoryDistribution && categoryDistribution.length > 0 ? (
                                // @ts-ignore
                                <CategoryDistributionList data={categoryDistribution} categories={categories} />
                            ) : (
                                <p className="text-center text-muted-foreground pt-12">{t('stats_summary_page.no_data')}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
                {include_subcode_distribution && (
                     <Card>
                        <CardHeader><CardTitle>{t('stats_summary_page.subcode_distribution_title')}</CardTitle></CardHeader>
                        <CardContent>
                        {subcodeDistribution && subcodeDistribution.length > 0 ? (
                            // @ts-ignore
                            <SubcodeDistributionList data={subcodeDistribution} categories={categories} />
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">{t('subcode_distribution_list.no_data')}</p>
                        )}
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }
    // Placeholder for other page types
    return (
        <pre className="mt-4 p-4 bg-muted rounded-md overflow-x-auto">
            <code>{JSON.stringify(sharedLink, null, 2)}</code>
        </pre>
    );
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{t('shared_page.title', { pageType: sharedLink.page_type })}</h1>
            <p className="text-muted-foreground">{t('shared_page.period', { period: sharedLink.period })}</p>
        </div>
        
        {renderContent()}

        <footer className="text-center mt-8">
            <Button asChild variant="ghost">
                <Link to="/">{t("shared_page.back_to_app")}</Link>
            </Button>
        </footer>
    </div>
  );
} 