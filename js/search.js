// search.js
document.getElementById("searchInput").addEventListener("input", function () {
  const searchText = this.value.toLowerCase();
  const allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");

  const filtered = allTransactions.filter((txn) => {
    return (
      txn.title.toLowerCase().includes(searchText) ||
      txn.category.toLowerCase().includes(searchText) ||
      txn.description.toLowerCase().includes(searchText) ||
      txn.paymentMethod.toLowerCase().includes(searchText) ||
      txn.amount.toString().includes(searchText) ||
      txn.date.includes(searchText) ||
      txn.email.toLowerCase().includes(searchText)
    );
  });

  updateDashboard(filtered); // << Filtered data based dashboard update
});
