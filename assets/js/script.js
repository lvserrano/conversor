// Função para mostrar o modal
function showComingSoon(
  title = "Em Breve!",
  message = "Esta funcionalidade está sendo desenvolvida e estará disponível muito em breve. Fique ligado para as novidades!",
  icon = "🚀"
) {
  const modal = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalIcon = document.getElementById("modalIcon");

  if (modal && modalTitle && modalMessage && modalIcon) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIcon.textContent = icon;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Função para fechar o modal
function closeModal() {
  const modal = document.getElementById("modalOverlay");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// Aguarda o DOM carregar completamente
document.addEventListener("DOMContentLoaded", function () {
  // Configura eventos do modal
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) {
    // Fechar modal clicando fora dele
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal();
      }
    });
  }

  // Fechar modal com tecla ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // Adiciona evento de click nos cards "coming-soon"
  const comingSoonCards = document.querySelectorAll(".coming-soon");
  comingSoonCards.forEach((card) => {
    card.addEventListener("click", function () {
      const title = this.querySelector(".tool-title, .partner-name");
      if (title) {
        showComingSoon(
          title.textContent + " - Em Breve!",
          "Esta funcionalidade está sendo desenvolvida e estará disponível muito em breve. Fique ligado para as novidades!",
          "🚀"
        );
      } else {
        showComingSoon();
      }
    });
  });

  // Animação suave no scroll
  const cards = document.querySelectorAll(".tool-card, .partner-card");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(card);
  });

  // Adiciona efeito de hover nos cards
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      if (!this.classList.contains("coming-soon")) {
        this.style.transform = "translateY(-8px) scale(1.02)";
      }
    });

    card.addEventListener("mouseleave", function () {
      if (!this.classList.contains("coming-soon")) {
        this.style.transform = "translateY(-3px) scale(1)";
      }
    });
  });
});

// Efeito parallax suave no background
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const parallax = document.querySelector(".background-pattern");
  if (parallax) {
    const speed = scrolled * 0.5;
    parallax.style.transform = `translateY(${speed}px)`;
  }
});
