const DEFAULT_FIRST_VISIT_LINES = Object.freeze([
  "처음 보는 얼굴이네요. EXCIT에 온 걸 환영해요.",
  "천천히 둘러보세요. 이곳에서 무엇을 할지는 직접 찾아가면 돼요.",
]);

const DEFAULT_RETURN_LINE = "다시 오셨네요. 편하게 둘러보세요.";
const DEFAULT_TOUR_OFFER = "길잡이에게 동네를 안내받을까요? Space : 안내받기 · Esc : 나중에 둘러보기";

export function createWelcomeController({
  getOnboardingState,
  completeWelcome,
  showDialog,
  hideDialog,
  requestTour = () => false,
  getTourStatus = () => "not_started",
  openActivityHelp = () => false,
  showActivityStatus = () => false,
  showTourChoices = null,
  firstVisitLines = DEFAULT_FIRST_VISIT_LINES,
  returnLine = DEFAULT_RETURN_LINE,
  tourOfferLine = DEFAULT_TOUR_OFFER,
}) {
  let nearbyEntry = null;
  let activeEntry = null;
  let lineIndex = -1;
  let returnGreetingOpen = false;
  let tourOfferOpen = false;

  const isWelcomeResident = (entry) => entry?.role === "welcome";
  const isWelcomeCompleted = () => Boolean(getOnboardingState()?.welcomeCompleted);

  function resetConversation() {
    activeEntry = null;
    lineIndex = -1;
    returnGreetingOpen = false;
    tourOfferOpen = false;
  }

  function close() {
    if (!activeEntry) return false;
    resetConversation();
    hideDialog();
    return true;
  }

  function beginFirstVisit(entry) {
    activeEntry = entry;
    lineIndex = 0;
    returnGreetingOpen = false;
    tourOfferOpen = false;
    showDialog(firstVisitLines[0], entry);
    return { handled: true, action: "show", text: firstVisitLines[0] };
  }

  function showTourOffer(entry) {
    activeEntry = entry;
    returnGreetingOpen = false;
    tourOfferOpen = true;
    lineIndex = -1;
    if (typeof showTourChoices !== "function") {
      showDialog(tourOfferLine, entry);
      return;
    }
    showTourChoices(tourOfferLine, entry, [
      {
        label: "동네 안내받기",
        onSelect: () => {
          const requested = requestTour();
          resetConversation();
          if (requested) showDialog("잠깐 기다려줘. 길잡이가 오고 있어.", entry, { variant: "compact" });
          else hideDialog();
        },
      },
      {
        label: "할 일 물어보기",
        onSelect: () => {
          resetConversation();
          openActivityHelp(entry);
        },
      },
      { label: "나중에 둘러보기", kind: "exit", onSelect: close },
    ]);
  }

  function updateNearby(entry) {
    const nextEntry = isWelcomeResident(entry) ? entry : null;
    if (nextEntry === nearbyEntry) return { changed: false };
    nearbyEntry = nextEntry;
    if (!nextEntry) {
      const closed = close();
      return { changed: closed, action: closed ? "close" : "none" };
    }
    if (!isWelcomeCompleted() && !activeEntry) return beginFirstVisit(nextEntry);
    return { changed: false };
  }

  function interact(entry) {
    if (!isWelcomeResident(entry)) return { handled: false };

    if (activeEntry === entry && tourOfferOpen && typeof showTourChoices !== "function") {
      const started = requestTour();
      close();
      return { handled: true, action: started ? "start-tour" : "close" };
    }

    if (isWelcomeCompleted()) {
      if (showActivityStatus(entry)) {
        resetConversation();
        return { handled: true, action: "activity-status" };
      }
      if (getTourStatus() !== "completed") {
        showTourOffer(entry);
        return { handled: true, action: "offer-tour", text: tourOfferLine };
      }
      if (activeEntry === entry && returnGreetingOpen) {
        close();
        return { handled: true, action: "close" };
      }
      activeEntry = entry;
      returnGreetingOpen = false;
      tourOfferOpen = false;
      lineIndex = -1;
      const opened = openActivityHelp(entry);
      if (!opened) {
        returnGreetingOpen = true;
        showDialog(returnLine, entry);
      } else {
        resetConversation();
      }
      return { handled: true, action: opened ? "activity-help" : "show", text: opened ? "" : returnLine };
    }

    if (activeEntry !== entry || lineIndex < 0) return beginFirstVisit(entry);
    if (lineIndex + 1 < firstVisitLines.length) {
      lineIndex += 1;
      showDialog(firstVisitLines[lineIndex], entry);
      return { handled: true, action: "show", text: firstVisitLines[lineIndex] };
    }

    completeWelcome();
    showTourOffer(entry);
    return { handled: true, action: "offer-tour", text: tourOfferLine };
  }

  return {
    close,
    interact,
    updateNearby,
    isOpen: () => Boolean(activeEntry),
    isChoiceOpen: () => tourOfferOpen && typeof showTourChoices === "function",
  };
}
