function applyStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

function createElement(tagName, { text = "", type = "", styles = {} } = {}) {
  const element = document.createElement(tagName);
  if (text) element.textContent = text;
  if (type) element.type = type;
  return applyStyles(element, styles);
}

function createButton(text, styles) {
  return createElement("button", {
    text,
    type: "button",
    styles: {
      cursor: "pointer",
      pointerEvents: "auto",
      fontWeight: "800",
      ...styles,
    },
  });
}

export function createWalletSessionUi({ uiLayer, devProfileIds }) {
  const walletHud = createElement("div", {
    styles: {
      position: "fixed", right: "12px", top: "72px", padding: "10px 12px",
      background: "rgba(20,20,20,0.52)", border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "12px", backdropFilter: "blur(4px)", color: "white",
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", lineHeight: "1.45",
      userSelect: "none", pointerEvents: "auto", zIndex: "1000002", display: "none",
    },
  });
  walletHud.id = "walletHud";
  uiLayer.appendChild(walletHud);

  const walletHudTitle = createElement("div", {
    text: "WALLET",
    styles: { fontWeight: "800", letterSpacing: "0.06em", opacity: "0.82", marginBottom: "6px" },
  });
  const walletHudAddress = createElement("div", { styles: { fontWeight: "700" } });
  const walletHudChain = createElement("div", { styles: { marginTop: "4px", opacity: "0.78" } });
  const walletHudNickname = createElement("div", {
    styles: { marginTop: "6px", fontWeight: "700", color: "#fff2bf" },
  });
  const walletHudLogoutBtn = createButton("로그아웃", {
    marginTop: "8px", padding: "6px 10px", borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.1)",
    color: "white", fontSize: "12px",
  });
  walletHud.append(walletHudTitle, walletHudAddress, walletHudChain, walletHudNickname, walletHudLogoutBtn);

  const walletLoginOverlay = createElement("div", {
    styles: {
      position: "fixed", inset: "0", display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(8,10,14,0.62)", backdropFilter: "blur(8px)", pointerEvents: "auto",
      zIndex: "1000003",
    },
  });
  walletLoginOverlay.id = "walletLoginOverlay";
  uiLayer.appendChild(walletLoginOverlay);

  const walletLoginCard = createElement("div", {
    styles: {
      width: "min(460px, calc(100vw - 36px))", padding: "24px 24px 20px",
      background: "rgba(245,245,245,0.96)", border: "1px solid rgba(0,0,0,0.14)",
      borderRadius: "18px", boxShadow: "0 20px 48px rgba(0,0,0,0.28)",
      fontFamily: "system-ui, -apple-system, sans-serif", color: "#222",
    },
  });
  walletLoginOverlay.appendChild(walletLoginCard);
  walletLoginCard.appendChild(createElement("div", {
    text: "메타마스크 로그인",
    styles: { fontSize: "26px", fontWeight: "900", letterSpacing: "-0.02em" },
  }));
  walletLoginCard.appendChild(createElement("div", {
    text: "지갑을 연결하고 서명하면 인증 서버가 nonce 검증을 거쳐 게임 세션을 발급합니다. 메타마스크 없이 먼저 체험하고 싶다면 게스트로 바로 시작할 수도 있습니다.",
    styles: { marginTop: "10px", fontSize: "14px", lineHeight: "1.65", color: "#555" },
  }));
  const walletLoginStatus = createElement("div", {
    text: "메타마스크 연결을 기다리는 중입니다.",
    styles: {
      marginTop: "16px", padding: "10px 12px", background: "rgba(0,0,0,0.05)",
      borderRadius: "12px", fontSize: "13px", lineHeight: "1.6", color: "#444",
    },
  });
  walletLoginCard.appendChild(walletLoginStatus);
  const walletLoginActions = createElement("div", {
    styles: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "18px" },
  });
  walletLoginCard.appendChild(walletLoginActions);
  const actionButtonStyles = {
    padding: "12px 16px", borderRadius: "12px", fontSize: "14px",
  };
  const walletConnectBtn = createButton("메타마스크 로그인", {
    ...actionButtonStyles, border: "none", background: "#f6851b", color: "white",
  });
  const walletGuestBtn = createButton("게스트로 시작", {
    ...actionButtonStyles, border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.9)", color: "#333",
  });
  const walletDevBypassBtn = createButton("개발자 모드로 바로 입장", {
    ...actionButtonStyles, border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.9)", color: "#333",
  });
  walletLoginActions.append(walletConnectBtn, walletGuestBtn, walletDevBypassBtn);

  const devProfileSwitcher = createElement("div", {
    styles: {
      position: "fixed", left: "50%", top: "18px", transform: "translateX(-50%)", display: "none",
      alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "14px",
      background: "rgba(26,30,36,0.84)", border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(6px)", boxShadow: "0 10px 28px rgba(0,0,0,0.24)", zIndex: "1000002",
    },
  });
  uiLayer.appendChild(devProfileSwitcher);
  devProfileSwitcher.appendChild(createElement("div", {
    text: "개발자 계정",
    styles: {
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "12px", fontWeight: "800",
      color: "rgba(255,255,255,0.88)",
    },
  }));
  const devProfileButtons = {};
  for (const profileId of devProfileIds) {
    const button = createButton(profileId === "dev_user_1" ? "개발자1" : "개발자2", {
      padding: "8px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.08)", color: "white", fontSize: "12px",
    });
    devProfileSwitcher.appendChild(button);
    devProfileButtons[profileId] = button;
  }
  const devResetButton = createButton("테스트 초기화", {
    padding: "8px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)", color: "white", fontSize: "12px",
  });
  devProfileSwitcher.appendChild(devResetButton);

  const walletNicknameOverlay = createElement("div", {
    styles: {
      position: "fixed", inset: "0", display: "none", alignItems: "center", justifyContent: "center",
      background: "rgba(8,10,14,0.58)", backdropFilter: "blur(8px)", pointerEvents: "auto",
      zIndex: "1000003",
    },
  });
  walletNicknameOverlay.id = "walletNicknameOverlay";
  uiLayer.appendChild(walletNicknameOverlay);
  const walletNicknameCard = createElement("div", {
    styles: {
      width: "min(420px, calc(100vw - 36px))", padding: "22px", background: "rgba(245,245,245,0.97)",
      border: "1px solid rgba(0,0,0,0.14)", borderRadius: "18px",
      boxShadow: "0 20px 48px rgba(0,0,0,0.28)",
      fontFamily: "system-ui, -apple-system, sans-serif", color: "#222",
    },
  });
  walletNicknameOverlay.appendChild(walletNicknameCard);
  walletNicknameCard.appendChild(createElement("div", {
    text: "닉네임 설정", styles: { fontSize: "24px", fontWeight: "900" },
  }));
  walletNicknameCard.appendChild(createElement("div", {
    text: "게임 안에서 사용할 닉네임을 정해주세요. 로그인 방식에 따라 지갑 계정 또는 로컬 게스트 세션에 저장됩니다.",
    styles: { marginTop: "10px", fontSize: "14px", lineHeight: "1.65", color: "#555" },
  }));
  const walletNicknameInput = createElement("input", {
    styles: {
      width: "100%", boxSizing: "border-box", marginTop: "16px", padding: "12px 14px",
      borderRadius: "12px", border: "1px solid rgba(0,0,0,0.18)", fontSize: "15px",
      fontWeight: "700", outline: "none", pointerEvents: "auto",
    },
  });
  walletNicknameInput.type = "text";
  walletNicknameInput.maxLength = 12;
  walletNicknameInput.placeholder = "예: 광부민수";
  walletNicknameCard.appendChild(walletNicknameInput);
  walletNicknameCard.appendChild(createElement("div", {
    text: "2~12자 / 한글, 영문, 숫자, 밑줄 사용 가능",
    styles: { marginTop: "8px", fontSize: "12px", color: "#666" },
  }));
  const walletNicknameStatus = createElement("div", {
    styles: { marginTop: "12px", minHeight: "20px", fontSize: "13px", lineHeight: "1.5", color: "#8a2b2b" },
  });
  walletNicknameCard.appendChild(walletNicknameStatus);
  const walletNicknameSaveBtn = createButton("닉네임 저장", {
    marginTop: "14px", padding: "12px 16px", borderRadius: "12px", border: "none",
    background: "#2d6cdf", color: "white", fontSize: "14px",
  });
  walletNicknameCard.appendChild(walletNicknameSaveBtn);

  function render({
    loggedIn, addressLabel, chainLabel, nickname, hasNickname, isDevSession,
    activeDevProfileId, devPresetEnabled, creditsLabel, equipmentProfile = {},
  }) {
    walletLoginOverlay.style.display = loggedIn ? "none" : "flex";
    walletHud.style.display = "none";
    walletHudAddress.textContent = loggedIn ? addressLabel : "";
    walletHudChain.textContent = chainLabel;
    walletHudNickname.textContent = hasNickname ? `닉네임: ${nickname}` : "닉네임: 설정 필요";
    if (equipmentProfile.address) {
      equipmentProfile.address.textContent = loggedIn ? addressLabel : "로그인 필요";
    }
    if (equipmentProfile.chain) equipmentProfile.chain.textContent = chainLabel;
    if (equipmentProfile.nickname) {
      equipmentProfile.nickname.textContent = hasNickname
        ? `닉네임: ${nickname}`
        : "닉네임: 설정 필요";
    }
    if (equipmentProfile.credits) equipmentProfile.credits.textContent = creditsLabel;
    if (equipmentProfile.logoutButton) {
      equipmentProfile.logoutButton.style.display = loggedIn ? "inline-flex" : "none";
    }
    if (equipmentProfile.copyButton) {
      equipmentProfile.copyButton.style.display = loggedIn ? "inline-flex" : "none";
      equipmentProfile.copyButton.disabled = !loggedIn;
      if (!loggedIn) equipmentProfile.copyButton.textContent = "복사";
    }
    walletNicknameInput.value = nickname;
    walletLoginStatus.textContent = loggedIn
      ? addressLabel === "GUEST"
        ? "게스트 계정으로 입장했습니다."
        : `${addressLabel} 주소로 로그인되었습니다.`
      : "메타마스크 연결을 기다리는 중입니다.";
    walletDevBypassBtn.style.display = devPresetEnabled ? "inline-flex" : "none";
    devProfileSwitcher.style.display = isDevSession ? "flex" : "none";
    for (const profileId of devProfileIds) {
      const button = devProfileButtons[profileId];
      const active = isDevSession && activeDevProfileId === profileId;
      button.style.background = active ? "rgba(255,183,77,0.92)" : "rgba(255,255,255,0.08)";
      button.style.borderColor = active ? "rgba(255,214,148,0.88)" : "rgba(255,255,255,0.16)";
      button.style.color = active ? "#3d2505" : "white";
    }
    walletNicknameOverlay.style.display = loggedIn && !hasNickname ? "flex" : "none";
  }

  function bindEvents({
    onConnect, onGuest, onDevBypass, onSwitchDevProfile, canResetDev, onResetDev,
    onNicknameSave, onLogout,
  }) {
    walletConnectBtn.addEventListener("click", onConnect);
    walletGuestBtn.addEventListener("click", onGuest);
    walletDevBypassBtn.addEventListener("click", onDevBypass);
    for (const profileId of devProfileIds) {
      devProfileButtons[profileId].addEventListener("click", () => onSwitchDevProfile(profileId));
    }
    devResetButton.addEventListener("click", () => {
      if (!canResetDev()) return;
      const confirmed = window.confirm(
        "공용 테스트 상태를 초기화할까요?\n맵 상태와 두 개발자 캐릭터 위치가 초기화되며, 인벤토리와 개인 창고는 기본 지급 상태로 돌아가고 개척 코인은 500으로 복구됩니다."
      );
      if (confirmed) onResetDev();
    });
    walletNicknameSaveBtn.addEventListener("click", onNicknameSave);
    walletNicknameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") onNicknameSave();
    });
    walletHudLogoutBtn.addEventListener("click", onLogout);
  }

  function setLoginBusy(busy) {
    walletConnectBtn.disabled = busy;
    walletConnectBtn.style.opacity = busy ? "0.65" : "1";
  }

  function setNicknameBusy(busy) {
    walletNicknameSaveBtn.disabled = busy;
    walletNicknameSaveBtn.style.opacity = busy ? "0.65" : "1";
  }

  async function copyAddress(address, copyButton) {
    await navigator.clipboard.writeText(address);
    if (!copyButton) return;
    copyButton.textContent = "복사됨";
    window.setTimeout(() => {
      copyButton.textContent = "복사";
    }, 1000);
  }

  return {
    bindEvents,
    copyAddress,
    render,
    setLoginBusy,
    setNicknameBusy,
    walletHud,
    walletHudAddress,
    walletHudChain,
    walletHudNickname,
    walletHudLogoutBtn,
    walletLoginOverlay,
    walletLoginStatus,
    walletConnectBtn,
    walletGuestBtn,
    walletDevBypassBtn,
    devProfileSwitcher,
    devProfileButtons,
    devResetButton,
    walletNicknameOverlay,
    walletNicknameInput,
    walletNicknameStatus,
    walletNicknameSaveBtn,
  };
}
