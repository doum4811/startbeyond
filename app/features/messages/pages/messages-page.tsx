export default function MessagesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 rounded-lg p-8">
            <div className="text-center">
                <h2 className="text-2xl font-semibold">Select a conversation</h2>
                <p className="text-muted-foreground mt-2">
                    Choose a conversation from the list on the left to see the messages.
                </p>
            </div>
        </div>
    );
} 