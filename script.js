(() => {
  "use strict";

  /* =====================================================
     API
  ====================================================== */

  const API_BASE = "http://127.0.0.1:8000";

  // Cmd/Ctrl + Shift + D
  const DEV_MODE = true;


  /* =====================================================
     ELEMENTS
  ====================================================== */

  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");

  const resetBtn = document.getElementById("reset-btn");
  const errorRetryBtn =
    document.getElementById("error-retry-btn");

  const stateIdle =
    document.getElementById("state-idle");

  const stateLoading =
    document.getElementById("state-loading");

  const stateResult =
    document.getElementById("state-result");

  const stateError =
    document.getElementById("state-error");

  const scoreNumberEl =
    document.getElementById("score-number");

  const scoreBandEl =
    document.getElementById("score-band");

  const scoreContextEl =
    document.getElementById("score-context");

  const errorLabelEl =
    document.getElementById("error-label");

  const errorCopyEl =
    document.getElementById("error-copy");

  const stressGroup =
    document.getElementById("stress_level_group");

  const stressInput =
    document.getElementById("stress_level");

  const inputCount =
    document.getElementById("input-count");

  const resultSection =
    document.getElementById("result-section");


  /* =====================================================
     INPUT COUNT
  ====================================================== */

  const requiredInputs = [
    "age",
    "gender",
    "country",
    "academic_level",
    "most_used_platform",
    "purpose_of_use",
    "avg_daily_usage_hours",
    "daily_unlocks",
    "study_hours",
    "physical_activity_hours",
    "sleep_hours_per_night",
    "stress_level"
  ];

  function updateInputCount() {
    let count = 0;

    requiredInputs.forEach((id) => {
      const el = document.getElementById(id);

      if (el && String(el.value).trim() !== "") {
        count++;
      }
    });

    inputCount.textContent =
      `${String(count).padStart(2, "0")} / 12`;
  }


  /* =====================================================
     STRESS
  ====================================================== */

  stressGroup
    .querySelectorAll(".seg-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        stressGroup
          .querySelectorAll(".seg-btn")
          .forEach((b) => {
            b.classList.remove("active");
          });

        button.classList.add("active");

        stressInput.value =
          button.dataset.value;

        clearFieldError(stressInput);

        updateInputCount();
      });

    });


  /* =====================================================
     FIELD ERRORS
  ====================================================== */

  function fieldWrapper(input) {
    return input?.closest(".field");
  }


  function setFieldError(input, message) {

    const wrapper = fieldWrapper(input);

    if (!wrapper) return;

    wrapper.classList.add("field-error");

    const messageElement =
      wrapper.querySelector(".error-msg");

    if (messageElement) {
      messageElement.textContent = message;
    }
  }


  function clearFieldError(input) {

    const wrapper = fieldWrapper(input);

    if (!wrapper) return;

    wrapper.classList.remove("field-error");

    const messageElement =
      wrapper.querySelector(".error-msg");

    if (messageElement) {
      messageElement.textContent = "";
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


  /* =====================================================
     COLLECT PAYLOAD
  ====================================================== */

  function collectPayload() {

    const fd = new FormData(form);

    return {

      age:
        fd.get("age") === ""
          ? NaN
          : parseInt(fd.get("age"), 10),

      gender:
        fd.get("gender") || "",

      country:
        (fd.get("country") || "").trim(),

      academic_level:
        fd.get("academic_level") || "",

      most_used_platform:
        fd.get("most_used_platform") || "",

      purpose_of_use:
        fd.get("purpose_of_use") || "",

      avg_daily_usage_hours:
        fd.get("avg_daily_usage_hours") === ""
          ? NaN
          : parseFloat(
              fd.get("avg_daily_usage_hours")
            ),

      daily_unlocks:
        fd.get("daily_unlocks") === ""
          ? NaN
          : parseInt(
              fd.get("daily_unlocks"),
              10
            ),

      study_hours:
        fd.get("study_hours") === ""
          ? NaN
          : parseFloat(
              fd.get("study_hours")
            ),

      physical_activity_hours:
        fd.get("physical_activity_hours") === ""
          ? NaN
          : parseFloat(
              fd.get("physical_activity_hours")
            ),

      sleep_hours_per_night:
        fd.get("sleep_hours_per_night") === ""
          ? NaN
          : parseFloat(
              fd.get("sleep_hours_per_night")
            ),

      stress_level:
        fd.get("stress_level") || ""
    };
  }


  /* =====================================================
     VALIDATION
  ====================================================== */

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
            "This field is required."
          ]);

        } else if (
          value < min ||
          value > max
        ) {

          errors.push([
            input,
            `Must be between ${min} and ${
              max === Infinity
                ? "0+"
                : max
            }.`
          ]);

        }

      }
    );


    [
      "gender",
      "country",
      "academic_level",
      "most_used_platform",
      "purpose_of_use"
    ].forEach((key) => {

      const input =
        document.getElementById(key);

      if (
        !payload[key] ||
        String(payload[key]).trim() === ""
      ) {

        errors.push([
          input,
          "This field is required."
        ]);

      }

    });


    if (!payload.stress_level) {

      errors.push([
        stressInput,
        "Pick a stress level."
      ]);

    }


    return errors;
  }


  /* =====================================================
     UI STATES
  ====================================================== */

  function showState(name) {

    const states = {
      idle: stateIdle,
      loading: stateLoading,
      result: stateResult,
      error: stateError
    };

    Object.values(states)
      .forEach((element) => {

        if (!element) return;

        element.hidden = true;
        element.style.display = "none";

      });


    const selected = states[name];

    if (selected) {

      selected.hidden = false;
      selected.style.display = "";

    }
  }


  showState("idle");


  /* =====================================================
     SUBMIT BUTTON
  ====================================================== */

  function setSubmitting(value) {

    submitBtn.disabled = value;

    submitBtn.classList.toggle(
      "loading",
      value
    );
  }


  /* =====================================================
     SCORE BAND
  ====================================================== */

  function bandFor(score) {

    if (score < 4) {

      return {

        label: "SIGNAL: STRAINED",

        context:
          "Your responses suggest elevated strain right now. Small shifts in sleep or screen time may help support your routine."

      };

    }


    if (score < 7) {

      return {

        label: "SIGNAL: BALANCED",

        context:
          "Your rhythm looks fairly steady, with some room to recover and reset."

      };

    }


    return {

      label: "SIGNAL: STRONG",

      context:
        "Your habits point to a well-supported baseline. Keep building consistent daily habits."

    };

  }


  /* =====================================================
     RESULT
  ====================================================== */

  function renderResult(score) {

    const clamped =
      Math.max(
        0,
        Math.min(10, score)
      );


    const {
      label,
      context
    } = bandFor(clamped);


    scoreNumberEl.textContent =
      score.toFixed(2);

    scoreBandEl.textContent =
      label;

    scoreContextEl.textContent =
      context;


    showState("result");

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  /* =====================================================
     ERROR
  ====================================================== */

  function renderError(label, message) {

    errorLabelEl.textContent =
      label;

    errorCopyEl.textContent =
      message;

    showState("error");

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  /* =====================================================
     SERVER VALIDATION
  ====================================================== */

  function applyServerValidationErrors(detail) {

    if (!Array.isArray(detail)) {
      return false;
    }

    let matched = false;


    detail.forEach((error) => {

      const field =
        Array.isArray(error.loc)
          ? error.loc[
              error.loc.length - 1
            ]
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
          error.msg ||
            "Invalid value."
        );

        matched = true;
      }

    });


    return matched;
  }


  /* =====================================================
     FORM SUBMIT
  ====================================================== */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      clearAllErrors();

      const payload =
        collectPayload();

      const clientErrors =
        validate(payload);


      if (clientErrors.length > 0) {

        clientErrors.forEach(
          ([input, message]) => {

            setFieldError(
              input,
              message
            );

          }
        );

        clientErrors[0][0]?.focus?.();

        updateInputCount();

        return;
      }


      setSubmitting(true);

      showState("loading");

      resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });


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


        /* 422 */

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
            "CHECK YOUR INPUTS",
            matched
              ? "A few fields need attention. Details are marked above."
              : "The API rejected this submission. Please review your inputs."
          );

          return;
        }


        /* OTHER ERRORS */

        if (!response.ok) {

          let message =
            `The API responded with status ${response.status}.`;


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
            "PREDICTION FAILED",
            message
          );

          return;
        }


        /* SUCCESS */

        const data =
          await response.json();


        if (
          typeof
            data.predicted_mental_health_score
          !== "number"
        ) {

          renderError(
            "UNEXPECTED RESPONSE",
            "The API responded, but the predicted score was missing."
          );

          return;
        }


        renderResult(
          data.predicted_mental_health_score
        );

      } catch (error) {

        renderError(
          "SERVER UNAVAILABLE",
          `Couldn't connect to ${API_BASE}. Make sure the backend is running with: uvicorn main:app --reload`
        );

      } finally {

        setSubmitting(false);

      }

    }
  );


  /* =====================================================
     CLEAR ERRORS + COUNT
  ====================================================== */

  form
    .querySelectorAll("input, select")
    .forEach((element) => {

      element.addEventListener(
        "input",
        () => {
          clearFieldError(element);
          updateInputCount();
        }
      );

      element.addEventListener(
        "change",
        () => {
          clearFieldError(element);
          updateInputCount();
        }
      );

    });


  /* =====================================================
     RESET
  ====================================================== */

  resetBtn.addEventListener(
    "click",
    () => {

      showState("idle");

      document
        .getElementById("calibrate")
        .scrollIntoView({
          behavior: "smooth"
        });

    }
  );


  errorRetryBtn.addEventListener(
    "click",
    () => {

      showState("idle");

      document
        .getElementById("calibrate")
        .scrollIntoView({
          behavior: "smooth"
        });

    }
  );


  /* =====================================================
     DEV MODE
     Cmd/Ctrl + Shift + D
  ====================================================== */

  if (DEV_MODE) {

    function fillDemoData() {

      document.getElementById("age").value =
        20;

      document.getElementById("country").value =
        "India";

      document.getElementById(
        "avg_daily_usage_hours"
      ).value = 5;

      document.getElementById(
        "daily_unlocks"
      ).value = 60;

      document.getElementById(
        "study_hours"
      ).value = 6;

      document.getElementById(
        "physical_activity_hours"
      ).value = 2;

      document.getElementById(
        "sleep_hours_per_night"
      ).value = 8;


      function setSelect(id, text) {

        const select =
          document.getElementById(id);

        const option =
          [...select.options]
            .find(
              (option) =>
                option.text
                  .trim()
                  .toLowerCase() ===
                text.toLowerCase()
            );


        if (option) {

          select.value =
            option.value;

          select.dispatchEvent(
            new Event(
              "change",
              {
                bubbles: true
              }
            )
          );

        }

      }


      setSelect(
        "gender",
        "Male"
      );

      setSelect(
        "academic_level",
        "Undergraduate"
      );

      setSelect(
        "most_used_platform",
        "YouTube"
      );

      setSelect(
        "purpose_of_use",
        "Education"
      );


      const mediumButton =
        [
          ...stressGroup.querySelectorAll(
            ".seg-btn"
          )
        ].find(
          (button) =>
            button.dataset.value ===
            "Medium"
        );


      if (mediumButton) {
        mediumButton.click();
      }


      updateInputCount();

      console.log(
        "DEV MODE: Demo data filled."
      );
    }


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


  /* =====================================================
     CURSOR EFFECT
  ====================================================== */

  const cursorGlow =
    document.querySelector(".cursor-glow");

  if (cursorGlow) {

    document.addEventListener(
      "mousemove",
      (event) => {

        cursorGlow.style.left =
          `${event.clientX}px`;

        cursorGlow.style.top =
          `${event.clientY}px`;

      }
    );

  }


  /* =====================================================
     HERO CTA
  ====================================================== */

  document
    .querySelector(".hero-cta")
    ?.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        document
          .getElementById("calibrate")
          .scrollIntoView({
            behavior: "smooth"
          });

      }
    );


  updateInputCount();

})();