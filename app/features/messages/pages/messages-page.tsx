import { useTranslation } from "react-i18next";

export default function MessagesPage() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 rounded-lg p-8">
            <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('messages.select_conversation')}</h2>
                <p className="text-muted-foreground mt-2">
                    {t('messages.select_conversation_description')}
                </p>
            </div>
        </div>
    );
} 