(() => {
  "use strict";

  // =========================================================
  // CONFIG
  // =========================================================

  const API_BASE = "http://127.0.0.1:8000";
  const DEV_MODE = true;


  // =========================================================
  // DOM ELEMENTS
  // =========================================================

  const form = document.getElementById("predict-form");

  // IMPORTANT:
  // Your HTML uses calculate-button, NOT submit-btn.
  const submitBtn = document.getElementById("calculate-button");

  const resetBtn = document.getElementById("reset-btn");
  const errorRetryBtn = document.getElementById("error-retry-btn");

  const stateIdle = document.getElementById("state-idle");
  const stateLoading = document.getElementById("state-loading");
  const stateResult = document.getElementById("state-result");
  const stateError = document.getElementById("state-error");

  const scoreNumberEl = document.getElementById("score-number");
  const scoreBandEl = document.getElementById("score-band");
  const scoreContextEl = document.getElementById("score-context");
  const gaugeFill = document.getElementById("score-fill");

  const errorLabelEl = document.getElementById("error-label");
  const errorCopyEl = document.getElementById("error-copy");

  const stressInput = document.getElementById("stress_level");


  if (!form) {
    console.error("Prediction form (#predict-form) not found.");
    return;
  }


  // =========================================================
  // HORIZONTAL TRACK NAVIGATION
  // =========================================================

  function setupHorizontalTrack({ trackId, panelSelector, leftId, rightId }) {
    const track = document.getElementById(trackId);
    const panels = track ? [...track.querySelectorAll(panelSelector)] : [];
    const left = document.getElementById(leftId);
    const right = document.getElementById(rightId);
    let index = 0;
    let wheelLocked = false;
    let pointerStart = null;

    if (!track || panels.length === 0) return () => {};

    track.tabIndex = 0;

    function moveTo(nextIndex) {
      index = Math.max(0, Math.min(nextIndex, panels.length - 1));
      track.style.transform = `translateX(-${index * 100}vw)`;
      if (left) left.disabled = index === 0;
      if (right) right.disabled = index === panels.length - 1;
    }

    left?.addEventListener("click", () => moveTo(index - 1));
    right?.addEventListener("click", () => moveTo(index + 1));

    track.addEventListener("wheel", (event) => {
      const horizontal = Math.abs(event.deltaX);
      const vertical = Math.abs(event.deltaY);

      if (horizontal <= vertical || horizontal < 12) return;

      event.preventDefault();
      if (wheelLocked) return;

      wheelLocked = true;
      moveTo(index + (event.deltaX > 0 ? 1 : -1));
      window.setTimeout(() => {
        wheelLocked = false;
      }, 650);
    }, { passive: false });

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      pointerStart = { x: event.clientX, y: event.clientY };
    });

    track.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;

      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;

      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        moveTo(index + (deltaX < 0 ? 1 : -1));
      }

      pointerStart = null;
    });

    track.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    track.addEventListener("keydown", (event) => {
      const tag = event.target?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
      if (event.key === "ArrowRight") moveTo(index + 1);
      if (event.key === "ArrowLeft") moveTo(index - 1);
    });

    moveTo(0);
    return moveTo;
  }

  const moveToExperience = setupHorizontalTrack({
    trackId: "experience-track",
    panelSelector: ".experience-panel",
    leftId: "experience-left",
    rightId: "experience-right",
  });

  const moveToCalculator = setupHorizontalTrack({
    trackId: "predict-form",
    panelSelector: ".calc-panel",
    leftId: "calc-left",
    rightId: "calc-right",
  });

  const calculatorPanels = [
    ...document.querySelectorAll("#predict-form .calc-panel")
  ];

  document.querySelectorAll(".next-calc").forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.dataset.next);
      if (Number.isFinite(nextIndex)) moveToCalculator(nextIndex);
    });
  });

  document.querySelectorAll(".continue-button").forEach((button) => {
    button.addEventListener("click", () => moveToExperience(1));
  });


  // =========================================================
  // CUSTOM SELECT BUTTONS
  // =========================================================

  function selectValue(
    selectId,
    value,
    buttons,
    valueGetter = (button) => button.dataset.value
  ) {

    const select = document.getElementById(selectId);

    if (!select) {
      return;
    }

    select.value = value;

    buttons.forEach((button) => {

      button.classList.toggle(
        "active",
        valueGetter(button) === value
      );

    });

    select.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );

    clearFieldError(select);
  }


  // Gender / academic level
  document.querySelectorAll("[data-select]").forEach((button) => {

    button.addEventListener("click", () => {

      const selectId = button.dataset.select;

      const buttons = [
        ...document.querySelectorAll(
          `[data-select="${selectId}"]`
        )
      ];

      selectValue(
        selectId,
        button.dataset.value,
        buttons
      );

    });

  });


  // =========================================================
  // PLATFORM
  // =========================================================

  document
    .querySelectorAll("[data-platform]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const value = button.dataset.platform;

        const buttons = [
          ...button.parentElement.querySelectorAll(
            "[data-platform]"
          )
        ];

        selectValue(
          "most_used_platform",
          value,
          buttons,
          (item) => item.dataset.platform
        );

      });

    });


  // =========================================================
  // PURPOSE
  // =========================================================

  document
    .querySelectorAll("[data-purpose]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const value = button.dataset.purpose;

        const buttons = [
          ...button.parentElement.querySelectorAll(
            "[data-purpose]"
          )
        ];

        selectValue(
          "purpose_of_use",
          value,
          buttons,
          (item) => item.dataset.purpose
        );

      });

    });


  // =========================================================
  // STRESS LEVEL
  // =========================================================

  document
    .querySelectorAll("[data-stress]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const value = button.dataset.stress;

        if (stressInput) {
          stressInput.value = value;
        }

        const buttons = [
          ...document.querySelectorAll("[data-stress]")
        ];

        buttons.forEach((item) => {

          item.classList.toggle(
            "active",
            item === button
          );

        });


        const pressureDisplay =
          document.getElementById("pressure-display");

        if (pressureDisplay) {
          pressureDisplay.textContent =
            value.toUpperCase();
        }


        clearFieldError(stressInput);

      });

    });


  // =========================================================
  // FIELD ERROR HELPERS
  // =========================================================

  function fieldWrapper(input) {

    if (!input) {
      return null;
    }

    return input.closest(".field");
  }


  function setFieldError(input, message) {

    const wrapper = fieldWrapper(input);

    if (!wrapper) {
      return;
    }

    wrapper.classList.add("field-error");

    const errorMessage =
      wrapper.querySelector(".error-msg");

    if (errorMessage) {
      errorMessage.textContent = message;
    }

  }


  function clearFieldError(input) {

    const wrapper = fieldWrapper(input);

    if (!wrapper) {
      return;
    }

    wrapper.classList.remove("field-error");

    const errorMessage =
      wrapper.querySelector(".error-msg");

    if (errorMessage) {
      errorMessage.textContent = "";
    }

  }


  function clearAllErrors() {

    form
      .querySelectorAll(".field")
      .forEach((field) => {

        field.classList.remove("field-error");

      });


    form
      .querySelectorAll(".error-msg")
      .forEach((message) => {

        message.textContent = "";

      });

  }


  // =========================================================
  // COLLECT PAYLOAD
  // =========================================================

  function collectPayload() {

    const fd = new FormData(form);

    return {

      age:
        fd.get("age") === ""
          ? NaN
          : Number(fd.get("age")),

      gender:
        (fd.get("gender") || "").trim(),

      country:
        (fd.get("country") || "").trim(),

      academic_level:
        (fd.get("academic_level") || "").trim(),

      most_used_platform:
        (fd.get("most_used_platform") || "").trim(),

      purpose_of_use:
        (fd.get("purpose_of_use") || "").trim(),

      avg_daily_usage_hours:
        fd.get("avg_daily_usage_hours") === ""
          ? NaN
          : Number(
              fd.get("avg_daily_usage_hours")
            ),

      daily_unlocks:
        fd.get("daily_unlocks") === ""
          ? NaN
          : Number(fd.get("daily_unlocks")),

      study_hours:
        fd.get("study_hours") === ""
          ? NaN
          : Number(fd.get("study_hours")),

      physical_activity_hours:
        fd.get("physical_activity_hours") === ""
          ? NaN
          : Number(
              fd.get("physical_activity_hours")
            ),

      sleep_hours_per_night:
        fd.get("sleep_hours_per_night") === ""
          ? NaN
          : Number(
              fd.get("sleep_hours_per_night")
            ),

      stress_level:
        (fd.get("stress_level") || "").trim()

    };

  }


  // =========================================================
  // VALIDATION
  // =========================================================

  function validate(payload) {

    const errors = [];


    const numericFields = [

      ["age", 10, 100],

      [
        "avg_daily_usage_hours",
        0,
        24
      ],

      [
        "daily_unlocks",
        0,
        Infinity
      ],

      [
        "study_hours",
        0,
        24
      ],

      [
        "physical_activity_hours",
        0,
        24
      ],

      [
        "sleep_hours_per_night",
        0,
        24
      ]

    ];


    numericFields.forEach(
      ([key, min, max]) => {

        const input =
          document.getElementById(key);

        const value =
          payload[key];


        if (
          value === "" ||
          value === null ||
          Number.isNaN(value)
        ) {

          errors.push([
            input,
            "Please fill this field."
          ]);

          return;
        }


        if (
          !Number.isFinite(value) ||
          value < min ||
          value > max
        ) {

          const maxText =
            max === Infinity
              ? "any value"
              : max;

          errors.push([
            input,
            `Enter a value between ${min} and ${maxText}.`
          ]);

        }

      }
    );


    const requiredTextFields = [

      "gender",
      "country",
      "academic_level",
      "most_used_platform",
      "purpose_of_use"

    ];


    requiredTextFields.forEach((key) => {

      const input =
        document.getElementById(key);

      const value =
        payload[key];


      if (
        !value ||
        String(value).trim() === ""
      ) {

        errors.push([
          input,
          "Please fill this field."
        ]);

      }

    });


    // Stress
    if (
      !payload.stress_level ||
      payload.stress_level.trim() === ""
    ) {

      errors.push([
        stressInput,
        "Please select your stress level."
      ]);

    }


    return errors;

  }


  // =========================================================
  // RESULT STATES
  // =========================================================

  function showState(stateName) {

    const states = [

      stateIdle,
      stateLoading,
      stateResult,
      stateError

    ];


    states.forEach((state) => {

      if (!state) {
        return;
      }

      state.hidden = true;
      state.style.display = "none";

    });


    const selectedState = {

      idle: stateIdle,
      loading: stateLoading,
      result: stateResult,
      error: stateError

    }[stateName];


    if (selectedState) {

      selectedState.hidden = false;
      selectedState.style.display = "";

    }

  }


  showState("idle");


  // =========================================================
  // SCORE BAND
  // =========================================================

  function getScoreBand(score) {

    if (score < 4) {

      return {

        label: "Signal: strained",

        context:
          "Your reported habits correspond to a lower model score. This prediction is informational and is not a diagnosis."

      };

    }


    if (score < 7) {

      return {

        label: "Signal: balanced",

        context:
          "Your reported habits correspond to a middle-range model score. This prediction is informational and is not a diagnosis."

      };

    }


    return {

      label: "Signal: strong",

      context:
        "Your reported habits correspond to a higher model score. This prediction is informational and is not a diagnosis."

    };

  }


  // =========================================================
  // RENDER RESULT
  // =========================================================

  function renderResult(score) {

    const numericScore = Number(score);


    if (!Number.isFinite(numericScore)) {

      renderError(
        "Invalid prediction",
        "The server returned an invalid score."
      );

      return;

    }


    const clampedScore =
      Math.max(
        0,
        Math.min(10, numericScore)
      );


    const band =
      getScoreBand(clampedScore);


    if (scoreNumberEl) {

      scoreNumberEl.textContent =
        numericScore.toFixed(2);

    }


    if (scoreBandEl) {

      scoreBandEl.textContent =
        band.label;

    }


    if (scoreContextEl) {

      scoreContextEl.textContent =
        band.context;

    }


    // Gauge
    if (gaugeFill) {

      const percentage =
        clampedScore / 10;

      gaugeFill.style.width =
        `${percentage * 100}%`;

    }


    showState("result");


    // =====================================================
    // IMPORTANT:
    // Automatically move to RESULT PANEL
    // =====================================================

    setTimeout(() => {

      moveToCalculator(
        calculatorPanels.length - 1
      );

    }, 150);

  }


  // =========================================================
  // ERROR
  // =========================================================

  function renderError(label, message) {

    if (errorLabelEl) {
      errorLabelEl.textContent = label;
    }


    if (errorCopyEl) {
      errorCopyEl.textContent = message;
    }


    showState("error");

  }


  // =========================================================
  // FASTAPI VALIDATION ERRORS
  // =========================================================

  function applyServerValidationErrors(detail) {

    if (!Array.isArray(detail)) {
      return false;
    }


    let matched = false;


    detail.forEach((error) => {

      const field =
        Array.isArray(error.loc)
          ? error.loc[error.loc.length - 1]
          : null;


      const input =
        field
          ? document.getElementById(field)
          : null;


      const target =
        field === "stress_level"
          ? stressInput
          : input;


      if (target) {

        setFieldError(
          target,
          error.msg || "Invalid value."
        );

        matched = true;

      }

    });


    return matched;

  }


  // =========================================================
  // SUBMIT / READ MY SIGNAL
  // =========================================================

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      clearAllErrors();


      // Collect everything
      const payload =
        collectPayload();


      // Validate everything
      const errors =
        validate(payload);


      // =====================================================
      // IF SOMETHING IS MISSING
      // =====================================================

      if (errors.length > 0) {

        errors.forEach(
          ([input, message]) => {

            if (input) {

              setFieldError(
                input,
                message
              );

            }

          }
        );


        // Move to the first panel containing an error
        const firstErrorInput =
          errors[0]?.[0];


        if (firstErrorInput) {

          const errorPanel =
            firstErrorInput.closest(
              ".calc-panel"
            );


          if (errorPanel) {

            const panelIndex =
              calculatorPanels.indexOf(
                errorPanel
              );


            if (panelIndex >= 0) {

              moveToCalculator(
                panelIndex
              );

            }

          }


          if (
            typeof firstErrorInput.focus ===
            "function"
          ) {

            setTimeout(() => {

              firstErrorInput.focus();

            }, 300);

          }

        }


        return;

      }


      // =====================================================
      // ALL INPUTS ARE VALID
      // =====================================================

      if (submitBtn) {

        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

      }


      // Go to result panel while processing
      showState("loading");


      moveToCalculator(
        calculatorPanels.length - 1
      );


      try {

        const response =
          await fetch(
            `${API_BASE}/predict`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(payload)

            }
          );


        // =================================================
        // FASTAPI 422
        // =================================================

        if (response.status === 422) {

          const body =
            await response
              .json()
              .catch(() => null);


          const matched =
            body &&
            applyServerValidationErrors(
              body.detail
            );


          renderError(
            "Check your inputs",
            matched
              ? "Please correct the highlighted fields."
              : "Some of the submitted values were rejected."
          );


          return;

        }


        // =================================================
        // OTHER API ERROR
        // =================================================

        if (!response.ok) {

          let message =
            `Server error (${response.status}).`;


          const body =
            await response
              .json()
              .catch(() => null);


          if (
            body &&
            typeof body.detail === "string"
          ) {

            message =
              body.detail;

          }


          renderError(
            "Prediction failed",
            message
          );


          return;

        }


        // =================================================
        // SUCCESS
        // =================================================

        const data =
          await response.json();


        const score =
          data.predicted_mental_health_score;


        if (
          typeof score !== "number" ||
          !Number.isFinite(score)
        ) {

          renderError(
            "Unexpected response",
            "The server responded, but no valid prediction score was returned."
          );


          return;

        }


        renderResult(score);


      } catch (error) {

        console.error(
          "Prediction request failed:",
          error
        );


        renderError(
          "Can't reach the server",
          `Couldn't connect to ${API_BASE}. Make sure FastAPI is running with: uvicorn main:app --reload`
        );

      } finally {

        if (submitBtn) {

          submitBtn.disabled = false;
          submitBtn.classList.remove("loading");

        }

      }

    }
  );


  // =========================================================
  // CLEAR ERRORS WHEN USER CHANGES INPUT
  // =========================================================

  form
    .querySelectorAll(
      "input, select"
    )
    .forEach((input) => {

      input.addEventListener(
        "input",
        () => clearFieldError(input)
      );


      input.addEventListener(
        "change",
        () => clearFieldError(input)
      );

    });


  // =========================================================
  // RESET
  // =========================================================

  resetBtn?.addEventListener(
    "click",
    () => {

      showState("idle");

      clearAllErrors();

      moveToCalculator(0);

    }
  );


  errorRetryBtn?.addEventListener(
    "click",
    () => {

      showState("idle");

      clearAllErrors();

      moveToCalculator(0);

    }
  );


  // =========================================================
  // DEV MODE
  // CMD + SHIFT + D / CTRL + SHIFT + D
  // =========================================================

  if (DEV_MODE) {

    function setSelectValue(
      id,
      value
    ) {

      const select =
        document.getElementById(id);


      if (!select) {

        console.warn(
          `DEV MODE: #${id} not found`
        );

        return false;

      }


      const option =
        [...select.options].find(
          (option) =>
            option.value === value ||
            option.text.trim() === value
        );


      if (!option) {

        console.warn(
          `DEV MODE: value "${value}" not found for #${id}`
        );

        return false;

      }


      select.value =
        option.value;


      // Activate corresponding custom button
      const buttons =
        document.querySelectorAll(
          `[data-select="${id}"]`
        );


      buttons.forEach((button) => {

        button.classList.toggle(
          "active",
          button.dataset.value ===
            option.value
        );

      });


      select.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );


      return true;

    }


    function setPlatform(value) {

      const select =
        document.getElementById(
          "most_used_platform"
        );


      if (!select) {
        return;
      }


      select.value = value;


      document
        .querySelectorAll(
          "[data-platform]"
        )
        .forEach((button) => {

          button.classList.toggle(
            "active",
            button.dataset.platform ===
              value
          );

        });


      select.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );

    }


    function setPurpose(value) {

      const select =
        document.getElementById(
          "purpose_of_use"
        );


      if (!select) {
        return;
      }


      select.value = value;


      document
        .querySelectorAll(
          "[data-purpose]"
        )
        .forEach((button) => {

          button.classList.toggle(
            "active",
            button.dataset.purpose ===
              value
          );

        });


      select.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );

    }


    function setStress(value) {

      const input =
        document.getElementById(
          "stress_level"
        );


      if (!input) {
        return;
      }


      input.value = value;


      document
        .querySelectorAll(
          "[data-stress]"
        )
        .forEach((button) => {

          button.classList.toggle(
            "active",
            button.dataset.stress ===
              value
          );

        });


      const display =
        document.getElementById(
          "pressure-display"
        );


      if (display) {

        display.textContent =
          value.toUpperCase();

      }


      input.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );

    }


    function fillDemoData() {

      // -----------------------------------------------
      // NUMERIC / TEXT INPUTS
      // -----------------------------------------------

      const values = {

        age: "20",

        country: "India",

        avg_daily_usage_hours: "10",

        daily_unlocks: "200",

        study_hours: "8",

        physical_activity_hours: "2",

        sleep_hours_per_night: "8"

      };


      Object.entries(values)
        .forEach(
          ([id, value]) => {

            const input =
              document.getElementById(id);


            if (!input) {

              console.warn(
                `DEV MODE: #${id} not found`
              );

              return;

            }


            input.value = value;


            input.dispatchEvent(
              new Event(
                "input",
                {
                  bubbles: true
                }
              )
            );


            input.dispatchEvent(
              new Event(
                "change",
                {
                  bubbles: true
                }
              )
            );

          }
        );


      // -----------------------------------------------
      // SELECTS
      // -----------------------------------------------

      setSelectValue(
        "gender",
        "Male"
      );


      setSelectValue(
        "academic_level",
        "Undergraduate"
      );


      setPlatform(
        "YouTube"
      );


      setPurpose(
        "Education"
      );


      // -----------------------------------------------
      // STRESS
      // -----------------------------------------------

      setStress(
        "Medium"
      );


      console.log(
        "DEV MODE: ALL demo inputs filled."
      );

    }


    // Keyboard shortcut
    document.addEventListener(
      "keydown",
      (event) => {

        if (
          (event.metaKey ||
            event.ctrlKey) &&
          event.shiftKey &&
          event.key.toLowerCase() === "d"
        ) {

          event.preventDefault();

          fillDemoData();

        }

      }
    );

  }


  console.log(
    "Mental Signal JS loaded successfully."
  );

})();