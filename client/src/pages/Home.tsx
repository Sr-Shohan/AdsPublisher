import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PARAMS_INFO } from "@shared/schema";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AdDisplay } from "@/components/AdDisplay";
import { useConsent } from "@/hooks/use-consent";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Play, Settings, Info, Settings2, LayoutGrid } from "lucide-react";

// Define form schema
const formSchema = z.object({
  ads: z.coerce.number().min(1).max(20).default(1),
  width: z.coerce.number().min(1).default(300),
  height: z.coerce.number().min(1).default(250),
  customParams: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string().default("")
  }))
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [adsUrls, setAdsUrls] = useState<{ url: string, w: number, h: number }[]>([]);
  const { resetConsent } = useConsent();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ads: 1,
      width: 300,
      height: 250,
      customParams: []
    }
  });

  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: "customParams"
  });

  // Group params by object for the select dropdown
  const groupedParams = PARAMS_INFO.reduce((acc, param) => {
    acc[param.object] = acc[param.object] || [];
    acc[param.object].push(param);
    return acc;
  }, {} as Record<string, typeof PARAMS_INFO>);

  const handleGenerate = (data: FormValues) => {
    const urls: { url: string, w: number, h: number }[] = [];
    const baseUrl = "https://ads.eskimi.com/getad/";
    
    // Construct base query params
    const queryParams = new URLSearchParams();
    queryParams.append("tag", "97cc83bb9917a07bdf3d53e8507157b2");
    queryParams.append("w", data.width.toString());
    queryParams.append("h", data.height.toString());
    queryParams.append("audit", "1");
    queryParams.append("domain", "demo.eskimi.com");
    // Fix: Use the hardcoded demo page URL to avoid 'invalidDomain' error
    queryParams.append("page", "https://demo.eskimi.com/publisher/");

    // Add custom params
    data.customParams.forEach(param => {
      if (param.key && param.value) {
        queryParams.append(param.key, param.value);
      }
    });

    const finalUrl = `${baseUrl}?${queryParams.toString()}`;

    for (let i = 0; i < data.ads; i++) {
      urls.push({
        url: finalUrl,
        w: data.width,
        h: data.height
      });
    }

    setAdsUrls(urls);
  };

  // Helper to get info for a selected param key
  const getParamInfo = (key: string) => PARAMS_INFO.find(p => p.key === key);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <div className="flex h-screen overflow-hidden">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          <ScrollArea className="flex-1">
            <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-12">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
                    Ad Generator
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-2xl font-medium opacity-80">
                    Construct and test ad placements with Eskimi DSP's powerful configuration suite.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-background/40 backdrop-blur-md p-2 rounded-2xl border border-border/50 shadow-sm">
                  <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    System Active
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background/60" onClick={resetConsent} title="Reset Settings">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Configuration Panel */}
                <Card className="xl:col-span-1 glass-card overflow-hidden h-fit xl:sticky xl:top-8 transition-all hover:shadow-2xl hover:shadow-primary/5 group/card">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                  <CardHeader className="relative border-b border-border/50 pb-6">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover/card:scale-110 transition-transform">
                        <Settings2 className="w-5 h-5" />
                      </div>
                      Configuration
                    </CardTitle>
                    <CardDescription>Fine-tune your ad request parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8 relative">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="width" className="text-sm font-semibold opacity-70">Width (px)</Label>
                        <Input 
                          id="width" 
                          type="number" 
                          {...form.register("width")} 
                          className="h-11 font-mono bg-muted/30 border-transparent focus:border-primary/30 focus:ring-primary/20 transition-all rounded-xl"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="height" className="text-sm font-semibold opacity-70">Height (px)</Label>
                        <Input 
                          id="height" 
                          type="number" 
                          {...form.register("height")}
                          className="h-11 font-mono bg-muted/30 border-transparent focus:border-primary/30 focus:ring-primary/20 transition-all rounded-xl"
                        />
                      </div>
                      <div className="space-y-2.5 col-span-2">
                        <Label htmlFor="ads" className="text-sm font-semibold opacity-70">Placements</Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            id="ads" 
                            type="number" 
                            {...form.register("ads")}
                            className="h-11 font-mono bg-muted/30 border-transparent focus:border-primary/30 focus:ring-primary/20 transition-all rounded-xl"
                          />
                          <div className="px-3 py-1 rounded-full bg-muted/50 border text-[10px] font-bold uppercase tracking-widest opacity-60">Max 20</div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/50" />

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-bold">Custom Parameters</Label>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => prepend({ key: "", value: "" })}
                          className="h-9 px-4 rounded-full font-semibold hover:scale-105 transition-transform bg-primary/5 text-primary hover:bg-primary/10 border-primary/10"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Param
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const currentKey = form.watch(`customParams.${index}.key`);
                          const paramInfo = getParamInfo(currentKey);

                          return (
                            <div key={field.id} className="group relative bg-muted/20 p-4 rounded-2xl border border-border/50 hover:border-primary/20 transition-all duration-300">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                                <div className="sm:col-span-5">
                                  <Select
                                    value={currentKey}
                                    onValueChange={(value) => {
                                      form.setValue(`customParams.${index}.key`, value);
                                      const info = getParamInfo(value);
                                      if (info) {
                                        form.setValue(`customParams.${index}.value`, ""); 
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-10 rounded-xl border-transparent bg-background/50 focus:ring-primary/20">
                                      <SelectValue placeholder="Key" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl">
                                      {Object.entries(groupedParams).map(([group, params]) => (
                                        <SelectGroup key={group}>
                                          <SelectLabel className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</SelectLabel>
                                          {params.sort((a,b) => a.key.localeCompare(b.key)).map(p => (
                                            <SelectItem key={p.key} value={p.key} className="rounded-lg mx-1 my-0.5 px-3">
                                              {p.key}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="sm:col-span-5">
                                  <Input
                                    placeholder={paramInfo?.default || "Value"}
                                    {...form.register(`customParams.${index}.value`)}
                                    className="h-10 font-mono bg-background/50 border-transparent focus:border-primary/20 rounded-xl"
                                  />
                                </div>
                                <div className="sm:col-span-2 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {paramInfo && (
                                <div className="mt-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/5">
                                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
                                  <span>
                                    <span className="font-bold text-foreground/80">{paramInfo.comment}</span>. Example: <span className="font-mono text-primary/80">{paramInfo.example}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {fields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-3xl bg-muted/10">
                            <p className="text-sm font-medium text-muted-foreground opacity-60 italic">No custom parameters added</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        className="flex-1 h-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-base"
                        onClick={form.handleSubmit(handleGenerate)}
                      >
                        <Play className="w-5 h-5 mr-3 fill-current" />
                        Generate Ads
                      </Button>
                      
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/50 hover:bg-muted/50 transition-colors hidden" title="Reset Cookie Consent" onClick={resetConsent}>
                        <Settings className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Ads Display Area */}
                <div className="xl:col-span-2 space-y-8">
                  <div className="flex items-end justify-between px-2">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Preview</h2>
                      <p className="text-muted-foreground mt-1">Live visualization of generated placements</p>
                    </div>
                    {adsUrls.length > 0 && (
                      <span className="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/10">
                        {adsUrls.length} Result{adsUrls.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {adsUrls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed rounded-[2.5rem] bg-muted/5 border-border/50 group/preview transition-colors hover:border-primary/20">
                      <div className="p-6 bg-primary/5 rounded-[2rem] mb-6 group-hover/preview:scale-110 transition-transform">
                        <LayoutGrid className="w-12 h-12 text-primary opacity-40" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">Ready for deployment</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm text-center text-base">
                        Your ad results will appear here after clicking <span className="font-bold text-foreground">Generate Ads</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {adsUrls.map((ad, i) => (
                        <AdDisplay 
                          key={`${i}-${ad.url}`}
                          url={ad.url}
                          width={ad.w}
                          height={ad.h}
                          index={i}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      <ConsentBanner />
    </div>
  );
}
