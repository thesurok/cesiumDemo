import { Component, output } from '@angular/core';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, Ruler } from 'lucide-angular';

export type ToolName = "ruler" | "pin";
export type ToolEntry = { name: ToolName, label: string, icon: string };

@Component({
  selector: 'app-tools-panel',
  host: {
    class: 'absolute inset-y-0 left-0 z-10 flex w-[75px] flex-col gap-2 bg-[#d4b1b1]/50 p-2',
  },
  imports: [LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Ruler, MapPin }),
    },
  ],
  templateUrl: './tools-panel.html',
  styleUrl: './tools-panel.css',
})

export class ToolsPanel {
  readonly tools: readonly ToolEntry[] = [
    { name: 'ruler', label: 'Ruler', icon: 'ruler' },
    { name: 'pin', label: 'Pin', icon: 'map-pin' }
  ]
  selectedTool: ToolName | null = null;

  toolSelected = output<ToolName>();

  selectTool(toolName: ToolName) {
    if (this.selectedTool === toolName) {
      this.selectedTool = null;
    } else {
      this.selectedTool = toolName;

    }
    this.toolSelected.emit(toolName);
  }
}
