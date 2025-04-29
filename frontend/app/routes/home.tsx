import { useState } from "react";
import {
    Card,
    CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export default function Index() {
    const [name, setName] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (name.trim()) {
            setSubmitted(true);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md p-6 text-center">
                <CardContent>
                    {!submitted ? (
                        <>
                            <h2 className="text-xl font-semibold mb-4">Wie heißt du?</h2>
                            <Input
                                placeholder="Dein Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mb-4"
                            />
                            <Button onClick={handleSubmit} className="w-full">
                                Weiter
                            </Button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold mb-4">Welcome {name}!</h2>
                            <img
                                src="/Ronaldo_SUI.jpg"
                                alt="Willkommen"
                                className="rounded-lg mx-auto"
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
