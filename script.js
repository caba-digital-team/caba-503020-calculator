// Exchange rates (static for now, but can be fetched from an API)
const exchangeRates = {
    GBP: 1,
    USD: 1.27,
    CAD: 1.71,
    AUD: 1.92
  };
  
  // Currency symbols mapping
  const currencySymbols = {
    GBP: "£",
    USD: "$",
    CAD: "$",
    AUD: "$"
  };
  
  document.getElementById("currency").addEventListener("change", updateCurrency);
  document.getElementById("income").addEventListener("input", formatIncome);
  document.getElementById("income").addEventListener("focus", clearDefaultValue);
  document.getElementById("income").addEventListener("blur", resetIfEmpty);
  document.getElementById("reset-btn").addEventListener("click", resetCalculator);
  document
    .getElementById("save-pdf-btn")
    .addEventListener("click", saveResultsAsPDF);
  document
    .getElementById("add-category-btn")
    .addEventListener("click", addCategory);
  
  // Store the last currency selected
  let lastSelectedCurrency = "GBP";
  
  // Default categories
  let categories = {
    Needs: 50,
    Wants: 30,
    Savings: 20
  };
  
  // Function to update currency and convert existing income value
function updateCurrency() {
    let selectedCurrency = document.getElementById("currency").value;
    let incomeField = document.getElementById("income");

    // Convert existing income value
    let currentIncome = getIncomeValue();
    if (!isNaN(currentIncome) && currentIncome > 0) {
        let convertedIncome = convertCurrency(currentIncome, lastSelectedCurrency, selectedCurrency);
        incomeField.value = convertedIncome.toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Update currency symbol
    document.querySelector(".currency-symbol").textContent = currencySymbols[selectedCurrency];

    // Store new selected currency
    lastSelectedCurrency = selectedCurrency;

    // Recalculate budget & update chart with new currency
    calculateBudget();
    updatePieChart(); // <--- Add this line to refresh the chart currency
}

  // Currency conversion function
  function convertCurrency(amount, fromCurrency, toCurrency) {
    return (amount / exchangeRates[fromCurrency]) * exchangeRates[toCurrency];
  }
  
  // Function to calculate and update the budget
  function calculateBudget() {
    let income = getIncomeValue();
  
    let selectedCurrency = document.getElementById("currency").value;
    let currencySymbol = currencySymbols[selectedCurrency];
  
    if (isNaN(income) || income < 0) {
      income = 0;
      document.getElementById("income").value = "";
    }
  
    let totalPercentage = Object.values(categories).reduce((a, b) => a + b, 0);
  
    let warningMessage = document.getElementById("warning-message");
    let unallocatedBudgetMessage = document.getElementById("unallocated-budget");
    let remainingPercentage = 100 - totalPercentage;
    let unallocatedBudget = (
      (income * Math.abs(remainingPercentage)) /
      100
    ).toFixed(2);
  
    // Always show the warning if percentages are not 100%
    if (totalPercentage !== 100) {
      warningMessage.style.display = "block";
      warningMessage.innerHTML =
        totalPercentage > 100
          ? "Budget has exceeded 100%. Please adjust."
          : "Budget percentages must add up to 100%.";
    } else {
      warningMessage.style.display = "none";
    }
  
    // Only show unallocated/overdrawn budget message if income is greater than 0
    if (income > 0) {
      if (totalPercentage < 100) {
        unallocatedBudgetMessage.style.display = "block";
        unallocatedBudgetMessage.innerHTML = `Unallocated Budget: ${currencySymbol}${parseFloat(
          unallocatedBudget
        ).toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
        unallocatedBudgetMessage.style.color = "red";
      } else if (totalPercentage > 100) {
        unallocatedBudgetMessage.style.display = "block";
        unallocatedBudgetMessage.innerHTML = `Overdrawn Budget: -${currencySymbol}${parseFloat(
          unallocatedBudget
        ).toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
        unallocatedBudgetMessage.style.color = "red";
      } else {
        unallocatedBudgetMessage.style.display = "none";
      }
    } else {
      unallocatedBudgetMessage.style.display = "none";
    }
  
    let resultsHTML = "<h3>budget breakdown</h3>";
    for (let category in categories) {
      let amount = (income * (categories[category] / 100)).toFixed(2);
      resultsHTML += `<p>${category} (<span class="category-percentage-display" data-name="${category}">${
        categories[category]
      }</span>%): ${currencySymbol}${parseFloat(amount).toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</p>`;
    }
  
    document.getElementById("results").innerHTML = resultsHTML;
    updatePieChart(); // Call function to update the chart
  }
  
  // Clears the default "0" when user starts typing
  function clearDefaultValue() {
    let incomeField = document.getElementById("income");
    if (incomeField.value === "0.00" || incomeField.value === "0") {
      incomeField.value = ""; // Clear field when user clicks
    }
  }
  
  // Resets to "0" if the user leaves the input empty
  function resetIfEmpty() {
    let incomeField = document.getElementById("income");
    if (incomeField.value.trim() === "") {
      incomeField.value = "0";
      calculateBudget();
    }
  }
  
  // Function to reset the calculator
  function resetCalculator() {
    document.getElementById("income").value = "0"; // Reset input field
    document.getElementById("currency").value = "GBP"; // Reset currency to GBP
    document.querySelector(".currency-symbol").textContent = "£"; // Reset symbol
  
    lastSelectedCurrency = "GBP"; // Reset stored currency
    categories = { Needs: 50, Wants: 30, Savings: 20 }; // Reset categories
  
    // Reset category input fields
    document.querySelectorAll(".category-percentage").forEach((input) => {
      let categoryName = input.getAttribute("data-name");
      if (categories[categoryName] !== undefined) {
        input.value = categories[categoryName]; // Set back to default values
      }
    });
  
    // Hide warning & unallocated/overdrawn budget messages
    document.getElementById("warning-message").style.display = "none";
    document.getElementById("unallocated-budget").style.display = "none";
  
    // Remove dynamically added categories
    document.querySelectorAll(".category").forEach((el, index) => {
      if (index > 2) el.remove(); // Keep first 3 categories (Needs, Wants, Savings)
    });
  
    calculateBudget();
  }
  
  // Function to add a new category above the "Add Category" button
  function addCategory() {
    // Get the number of additional categories (excluding Needs, Wants, and Savings)
    let existingCategories = Object.keys(categories).length;

    // Limit to 5 additional categories (so total allowed = 8)
    if (existingCategories >= 8) {
        alert("You can only add up to 5 extra categories.");
        return;
    }

    let newCategoryName = prompt("Enter category name:");
    if (!newCategoryName) return;

    let newCategoryPercentage = prompt("Enter percentage allocation:");
    newCategoryPercentage = parseFloat(newCategoryPercentage);

    if (isNaN(newCategoryPercentage) || newCategoryPercentage <= 0) {
        alert("Invalid percentage. Try again.");
        return;
    }

    categories[newCategoryName] = newCategoryPercentage;

    let categoryContainer = document.getElementById("category-container");
    let addCategoryButton = document.getElementById("add-category-btn");

    // Create a new category div
    let newCategoryDiv = document.createElement("div");
    newCategoryDiv.classList.add("category");
    newCategoryDiv.innerHTML = `
        <span>${newCategoryName} (${newCategoryPercentage}%)</span>
        <input type="number" class="category-percentage" value="${newCategoryPercentage}" data-name="${newCategoryName}">
        <button class="delete-category" onclick="deleteCategory('${newCategoryName}', this)">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Insert the new category ABOVE the Add Category button
    categoryContainer.insertBefore(newCategoryDiv, addCategoryButton);

    calculateBudget();
}
  
  // Function to delete a category
  function deleteCategory(categoryName, element) {
    let categoryDiv = element.parentElement; // Get the category div
  
    // Add CSS class to animate removal
    categoryDiv.style.transition = "all 0.3s ease";
    categoryDiv.style.transform = "translateY(-10px)";
    categoryDiv.style.opacity = "0";
  
    setTimeout(() => {
      delete categories[categoryName]; // Remove category from object
      categoryDiv.remove(); // Remove from UI
      calculateBudget(); // Recalculate the budget
    }, 300); // Wait for animation to finish before removing
  }
  
  // Function to save results as a PDF
  function saveResultsAsPDF() {
    let { jsPDF } = window.jspdf;
    let doc = new jsPDF();
  
    let income = getIncomeValue(); // Get properly formatted income value
    let selectedCurrency = document.getElementById("currency").value;
    let currencySymbol = currencySymbols[selectedCurrency];
  
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CABA 50-30-20 Budget Results", 20, 20);
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(
      `Monthly Income: ${currencySymbol}${income.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      20,
      40
    );
    doc.text(`Currency: ${selectedCurrency}`, 20, 50);
  
    doc.setFont("helvetica", "bold");
    doc.text("Budget Breakdown:", 20, 70);
  
    let yPos = 85;
    for (let category in categories) {
      let amount = (income * (categories[category] / 100)).toFixed(2);
      let formattedAmount = parseFloat(amount).toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  
      doc.text(
        `${category} (${categories[category]}%): ${currencySymbol}${formattedAmount}`,
        20,
        yPos
      );
      yPos += 10;
    }
  
    // Save PDF
    doc.save("budget_results.pdf");
  }
  
  // Handle category input changes dynamically
  document.addEventListener("input", function (event) {
    if (event.target.classList.contains("category-percentage")) {
        let categoryName = event.target.getAttribute("data-name");
        let newValue = parseFloat(event.target.value);

        if (isNaN(newValue) || newValue < 1) {
            newValue = 1;
        } else if (newValue > 100) {
            newValue = 100;
        }

        categories[categoryName] = newValue;
        event.target.value = newValue; // ✅ Force input field to stay within limits

        calculateBudget(); // Update budget breakdown
    }
});

  
  // Initialize default calculations on page load
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("income").dispatchEvent(new Event("input"));
  });
  
  // Function to format the income input with commas while typing
  function formatIncome() {
    let incomeField = document.getElementById("income");
    let rawValue = incomeField.value.replace(/,/g, ""); // Remove commas

    // ✅ Allow only numbers & a single decimal point
    rawValue = rawValue.replace(/[^\d.]/g, "");

    // ✅ Ensure only one decimal point is allowed
    let parts = rawValue.split(".");
    if (parts.length > 2) {
        rawValue = parts[0] + "." + parts.slice(1).join(""); // Keep only the first decimal point
    }

// ✅ Limit the whole number part to 5 digits, even if there's no decimal
parts[0] = parts[0].substring(0, 5);

// ✅ If the user types a decimal, allow only up to 2 digits after it
if (parts.length > 1) {
    parts[1] = parts[1].substring(0, 2);
    rawValue = parts.join("."); // Rebuild with decimal if needed
} else {
    rawValue = parts[0]; // No decimal, just enforce the 5-digit limit
}



    // ✅ Preserve the decimal if the user has started typing it
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2); // Limit to 2 decimal places
        rawValue = parts.join("."); // Keep the decimal and any valid numbers after it
    }

    // Convert to a number & format with commas **only if the user has entered digits**
    let numericValue = parseFloat(rawValue);
    let formattedValue = rawValue; // Default to raw input

    if (!isNaN(numericValue)) {
        formattedValue = numericValue.toLocaleString("en-GB", {
            minimumFractionDigits: parts.length > 1 ? parts[1].length : 0, // Only apply decimals if user has typed them
            maximumFractionDigits: 2
        });

        // Ensure the decimal point is preserved if the user is still typing it
        if (rawValue.endsWith(".")) {
            formattedValue += ".";
        }
    }

    // Preserve cursor position
    let cursorPosition = incomeField.selectionStart;
    let diff = formattedValue.length - rawValue.length;
    let newCursorPosition = cursorPosition + diff;

    // ✅ Apply the formatted value back to the input field
    incomeField.value = formattedValue;
    incomeField.setSelectionRange(newCursorPosition, newCursorPosition);

    calculateBudget(); // Ensure calculations remain accurate
}




  
  // Function to get the numeric value from the formatted input
  function getIncomeValue() {
    let incomeField = document.getElementById("income").value;
    let rawValue = incomeField.replace(/,/g, "").replace(/[^\d.]/g, ""); // Allow only numbers & decimal points
    return parseFloat(rawValue) || 0;
  }
  
  // Function to update the pie chart dynamically
function updatePieChart() {
    let chartCanvas = document.getElementById("budgetChart");

    // Destroy previous chart before creating a new one
    if (window.budgetChart instanceof Chart) {
        window.budgetChart.destroy();
    }

    let categoryLabels = Object.keys(categories);
    let categoryValues = categoryLabels.map(label => {
        let income = getIncomeValue();
        return (income * categories[label]) / 100; // Convert percentages to money
    });

    let income = getIncomeValue(); // Get the total income

// Ensure the pie chart remains visible even if all values are zero
if (categoryValues.every(value => value === 0)) {
    categoryValues = categoryLabels.map(() => 0.01); // Keep chart visible but ensure correct tooltip display
}




    let selectedCurrency = document.getElementById("currency").value;
    let currencySymbol = currencySymbols[selectedCurrency]; // Get the latest currency

    // Create new pie chart
    window.budgetChart = new Chart(chartCanvas, {
        type: "pie",
        data: {
            labels: categoryLabels.map(label => {
                return `${label} (${categories[label]}%)`; // Append percentage
            }),
            datasets: [{
                data: categoryValues,
                backgroundColor: ["#5b1b6c", "#ff9800", "#4caf50", "#2196f3", "#f44336"],
                borderWidth: 1
            }]
        },
options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom", // Moves the legend below the chart
            labels: {
                font: {
                    size: 16 // Keep the larger font size for better readability
                }
            }
        },

        tooltip: {
            callbacks: {
                label: function (tooltipItem) {
                    let dataset = tooltipItem.dataset.data;
                    let index = tooltipItem.dataIndex;
let monetaryValue = dataset[index];
                    let income = getIncomeValue(); // Get total income
        
                    // Fetch the latest currency symbol dynamically
                    let selectedCurrency = document.getElementById("currency").value;
                    let currencySymbol = currencySymbols[selectedCurrency];
        
                    return `${currencySymbol}${monetaryValue.toLocaleString("en-GB", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    })} / ${currencySymbol}${income.toLocaleString("en-GB", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    })}`;
                }
            }
        }
    }
}
})}



