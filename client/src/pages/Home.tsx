import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PARAMS_INFO, insertConfigurationSchema, type Configuration } from "@shared/schema";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AdDisplay } from "@/components/AdDisplay";
import { ConfigurationList } from "@/components/ConfigurationList";
import { useCreateConfiguration } from "@/hooks/use-configurations";
import { useConsent } from "@/hooks/use-consent";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Play, Save, History, LayoutGrid, Settings, Info, Settings2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [configName, setConfigName] = useState("");
  const { resetConsent } = useConsent();
  
  const createConfigMutation = useCreateConfiguration();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ads: 1,
      width: 300,
      height: 250,
      customParams: []
    }
  });

  const { fields, append, remove } = useFieldArray({
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
    queryParams.append("page", window.location.href); // Should be encoded by URLSearchParams automatically

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

  const handleSaveConfig = () => {
    if (!configName) return;
    
    const formValues = form.getValues();
    const customParamsObj = formValues.customParams.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    createConfigMutation.mutate({
      name: configName,
      ads: formValues.ads,
      width: formValues.width,
      height: formValues.height,
      customParams: customParamsObj
    }, {
      onSuccess: () => {
        setSaveDialogOpen(false);
        setConfigName("");
      }
    });
  };

  const loadConfiguration = (config: Configuration) => {
    const customParamsArray = Object.entries(config.customParams as Record<string, string>).map(([key, value]) => ({
      key,
      value
    }));

    form.reset({
      ads: config.ads,
      width: config.width,
      height: config.height,
      customParams: customParamsArray
    });
  };

  // Helper to get info for a selected param key
  const getParamInfo = (key: string) => PARAMS_INFO.find(p => p.key === key);

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex w-80 flex-col border-r bg-muted/10 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50">
            <h1 className="text-xl font-bold font-display bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Ad Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Eskimi DSP Client Demo</p>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <History className="w-3 h-3" /> Saved Presets
              </h2>
              <ConfigurationList onLoad={loadConfiguration} />
            </div>
          </div>

          <div className="p-4 border-t border-border/50">
            <Button variant="outline" className="w-full justify-start text-xs" onClick={resetConsent}>
              <Settings className="w-3.5 h-3.5 mr-2" />
              Reset Cookie Consent
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <h1 className="font-bold font-display text-lg">Ad Generator</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><LayoutGrid className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-6 border-b">
                  <SheetTitle>Saved Presets</SheetTitle>
                  <SheetDescription>Load your saved configurations</SheetDescription>
                </div>
                <ConfigurationList onLoad={loadConfiguration} />
                <div className="p-4 border-t mt-auto">
                   <Button variant="outline" className="w-full" onClick={resetConsent}>
                    Reset Cookie Consent
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <Card className="xl:col-span-1 shadow-lg border-border/60 h-fit sticky top-8">
                  <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-primary" />
                      Configuration
                    </CardTitle>
                    <CardDescription>Set parameters for the ad request.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width</Label>
                        <Input 
                          id="width" 
                          type="number" 
                          {...form.register("width")} 
                          className="font-mono bg-muted/20 focus:bg-background transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Input 
                          id="height" 
                          type="number" 
                          {...form.register("height")}
                          className="font-mono bg-muted/20 focus:bg-background transition-colors"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="ads">Number of Ads</Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            id="ads" 
                            type="number" 
                            {...form.register("ads")}
                            className="font-mono bg-muted/20 focus:bg-background transition-colors"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Max 20</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Custom Parameters</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="xs" 
                          onClick={() => append({ key: "", value: "" })}
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {fields.map((field, index) => {
                          const currentKey = form.watch(`customParams.${index}.key`);
                          const paramInfo = getParamInfo(currentKey);

                          return (
                            <div key={field.id} className="group relative bg-muted/20 p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
                              <div className="flex gap-2 mb-2">
                                <div className="flex-1 min-w-0">
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
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Parameter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(groupedParams).map(([group, params]) => (
                                        <SelectGroup key={group}>
                                          <SelectLabel>{group}</SelectLabel>
                                          {params.sort((a,b) => a.key.localeCompare(b.key)).map(p => (
                                            <SelectItem key={p.key} value={p.key} className="text-xs">
                                              {p.key}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              <Input
                                placeholder={paramInfo?.default || "Value"}
                                {...form.register(`customParams.${index}.value`)}
                                className="h-8 text-xs font-mono bg-white/50"
                              />
                              
                              {paramInfo && (
                                <div className="mt-2 flex items-start gap-1.5 text-[10px] text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 p-1.5 rounded text-blue-600 dark:text-blue-300">
                                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span>
                                    <span className="font-semibold">{paramInfo.comment}</span>. Example: {paramInfo.example}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {fields.length === 0 && (
                          <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10">
                            <p className="text-xs text-muted-foreground">No custom parameters added</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={form.handleSubmit(handleGenerate)}
                      >
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Generate Ads
                      </Button>
                      
                      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="px-3" title="Save Configuration">
                            <Save className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Configuration</DialogTitle>
                            <DialogDescription>
                              Give your current settings a name to easily load them later.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="configName" className="mb-2 block">Name</Label>
                            <Input
                              id="configName"
                              value={configName}
                              onChange={(e) => setConfigName(e.target.value)}
                              placeholder="e.g. Mobile Banner Test"
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveConfig} disabled={!configName || createConfigMutation.isPending}>
                              {createConfigMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Ads Display Area */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-foreground">Preview</h2>
                      <p className="text-muted-foreground">Generated ad placements</p>
                    </div>
                    {adsUrls.length > 0 && (
                      <span className="text-sm font-mono bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {adsUrls.length} Result{adsUrls.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {adsUrls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-2xl bg-muted/5 text-muted-foreground">
                      <div className="p-4 bg-muted/20 rounded-full mb-4">
                        <LayoutGrid className="w-8 h-8 opacity-50" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">No ads generated yet</h3>
                      <p className="text-sm mt-1 max-w-xs text-center">
                        Configure your settings on the left and click "Generate Ads" to see the preview.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
