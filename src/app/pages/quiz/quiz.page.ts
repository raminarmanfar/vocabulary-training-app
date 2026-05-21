import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonCard, IonCardContent,
  IonIcon, IonFab, IonFabButton
} from "@ionic/angular/standalone";
import { AlertController } from "@ionic/angular";
import { TranslatePipe } from "@ngx-translate/core";
import { TranslateService } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { helpCircleOutline, listOutline, pencilOutline, linkOutline, trashOutline, addOutline } from "ionicons/icons";
import { VocabularyService } from "../../services/vocabulary.service";
import { QuizSet, QuizType } from "../../models/quiz-set.model";
import { QuizSetService } from "../../services/quiz-set.service";

@Component({
  selector: "app-quiz",
  standalone: true,
  templateUrl: "./quiz.page.html",
  styleUrls: ["./quiz.page.scss"],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonCard, IonCardContent,
    IonIcon, IonFab, IonFabButton,
    TranslatePipe
  ]
})
export class QuizPage implements OnInit {
  private vocabService = inject(VocabularyService);
  private quizSetService = inject(QuizSetService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);

  quizSets = toSignal(this.quizSetService.quizSets$, { initialValue: [] as QuizSet[] });

  readonly quizTypes: Array<{ value: QuizType; labelKey: string; icon: string }> = [
    { value: "multiple-choice", labelKey: "quiz.type.multipleChoice", icon: "list-outline" },
    { value: "fill-blank",      labelKey: "quiz.type.fillBlank",      icon: "pencil-outline" },
    { value: "matching",        labelKey: "quiz.type.matching",        icon: "link-outline" },
  ];

  constructor() {
    addIcons({ helpCircleOutline, listOutline, pencilOutline, linkOutline, trashOutline, addOutline });
  }

  async ngOnInit() {
    await this.vocabService.seedSampleData();
    await Promise.all([this.vocabService.load(), this.quizSetService.load()]);
  }

  quizTypeLabel(type: QuizType): string {
    return this.quizTypes.find(t => t.value === type)?.labelKey ?? "";
  }

  quizTypeIcon(type: QuizType): string {
    return this.quizTypes.find(t => t.value === type)?.icon ?? "help-circle-outline";
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  }

  async deleteQuizSet(qs: QuizSet, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('quiz.delete.title'),
      message: this.translate.instant('quiz.delete.message'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.delete'),
          role: 'destructive',
          handler: () => this.quizSetService.delete(qs._id)
        }
      ]
    });
    await alert.present();
  }

  openQuiz(qs: QuizSet) {
    this.router.navigate(["/quiz/new"], {
      queryParams: {
        type: qs.quizType,
        direction: qs.direction,
        count: qs.totalQuestions,
        id: qs._id,
        autostart: qs.status === "in-progress" ? "1" : null
      }
    });
  }

  newQuiz() {
    this.router.navigate(["/quiz/new"]);
  }
}
