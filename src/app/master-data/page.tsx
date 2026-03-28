export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CityManagement } from "@/components/master-data/city-management";
import { HoldingTypeManagement } from "@/components/master-data/holding-type-management";
import { HsnCodeManagement } from "@/components/master-data/hsn-code-management";
import { MapPin, Layers, Hash } from "lucide-react";

export default async function MasterDataPage() {
    const [cities, holdingTypes, hsnCodes] = await Promise.all([
        apiFetch<any[]>("/api/master-data/cities"),
        apiFetch<any[]>("/api/master-data/holding-types"),
        apiFetch<any[]>("/api/master-data/hsn-codes"),
    ]);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Master Data Management
                </h1>
                <p className="text-muted-foreground">
                    Manage cities, holding types, and HSN codes for the system.
                </p>
            </div>

            <Tabs defaultValue="cities" className="space-y-6">
                <div className="border-b border-border/50">
                    <TabsList className="bg-transparent h-auto p-0 gap-8">
                        <TabsTrigger
                            value="cities"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent rounded-none px-2 py-4 text-muted-foreground data-[state=active]:text-foreground transition-all duration-200"
                        >
                            <MapPin className="mr-2 h-4 w-4" />
                            Cities
                        </TabsTrigger>
                        <TabsTrigger
                            value="types"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent rounded-none px-2 py-4 text-muted-foreground data-[state=active]:text-foreground transition-all duration-200"
                        >
                            <Layers className="mr-2 h-4 w-4" />
                            Holding Types
                        </TabsTrigger>
                        <TabsTrigger
                            value="hsn"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent rounded-none px-2 py-4 text-muted-foreground data-[state=active]:text-foreground transition-all duration-200"
                        >
                            <Hash className="mr-2 h-4 w-4" />
                            HSN Codes
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="cities" className="mt-0 outline-none">
                    <CityManagement cities={cities} />
                </TabsContent>

                <TabsContent value="types" className="mt-0 outline-none">
                    <HoldingTypeManagement holdingTypes={holdingTypes} />
                </TabsContent>

                <TabsContent value="hsn" className="mt-0 outline-none">
                    <HsnCodeManagement hsnCodes={hsnCodes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
