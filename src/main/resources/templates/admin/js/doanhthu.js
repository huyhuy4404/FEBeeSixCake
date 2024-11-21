var app = angular.module('myApp', []);
app.controller("CheckLogin", function ($scope, $http, $window) {
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;
    $scope.user = {
      idaccount: "",
      password: "",
    };
    $scope.loginError = ""; // Biến để lưu thông báo lỗi
  
    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem("loggedInUser")) {
      $scope.isLoggedIn = true;
      $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
      $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
    }
  
    // Hàm cập nhật giao diện
    $scope.updateAccountMenu = function () {
      $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };
  
    // Phương thức đăng nhập
    $scope.login = function () {
      if (!$scope.isLoggedIn) {
        $scope.loginError = ""; // Reset thông báo lỗi
  
        // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
        $http
          .get("http://localhost:8080/beesixcake/api/account")
          .then(function (response) {
            $scope.accounts = response.data;
            var foundAccount = $scope.accounts.find(
              (account) =>
                account.idaccount === $scope.user.idaccount &&
                account.password === $scope.user.password
            );
  
            if (foundAccount) {
              if (foundAccount.admin) {
                // Nếu tài khoản là admin
                $scope.loginError = "Bạn không có quyền truy cập!";
              } else {
                // Đăng nhập thành công
                $scope.loginSuccess = "Đăng nhập thành công!";
                // Lưu thông tin đăng nhập vào localStorage
                localStorage.setItem(
                  "loggedInUser",
                  JSON.stringify(foundAccount)
                );
  
                // Cập nhật giao diện
                $scope.updateAccountMenu();
  
                // Chuyển hướng về trang chính ngay lập tức
                $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
              }
            } else {
              // Nếu tài khoản không đúng hoặc mật khẩu không khớp
              $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
            }
          })
          .catch(function (error) {
            // Xử lý lỗi từ API
            $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
            console.error("Error:", error);
          });
      } else {
        alert("Bạn đã đăng nhập rồi.");
      }
    };
  
    // Phương thức đăng xuất
    $scope.logout = function () {
      localStorage.removeItem("loggedInUser");
      $scope.isLoggedIn = false;
      $scope.loggedInUser = null;
      $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
  });      
  app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.groupedOrderDetails = [];
    $scope.categories = []; // List of product categories

    $scope.orders = []; // List of all orders
    $scope.filteredOrders = []; // List of filtered orders
    $scope.totalRevenue = 0; // Total revenue
    $scope.totalOrdersCount = 0; // Total number of orders
    $scope.statusPayments = []; // Variable to store payment statuses

    // Initialize start and end dates
    $scope.startDate = null; 
    $scope.endDate = null; 

    // Function to fetch product categories
    $scope.getCategories = function() {
        $http.get('http://localhost:8080/beesixcake/api/category')
        .then(function(response) {
            $scope.categories = response.data; // Store product categories
            $scope.getDiscounts(); // Fetch discounts after categories are loaded
        })
        .catch(function(error) {
            console.error('Error fetching categories:', error);
        });
    };

    // Function to fetch product details
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/productdetail')
        .then(function(response) {
            $scope.orderdetai = response.data.map(function(item) {
                return {
                    categoryName: item.product.category.categoryname,
                    price: item.unitprice,
                    quantityInStock: item.quantityinstock,
                    productId: item.idproduct,
                };
            });
            $scope.groupData(); // Group data after fetching product details
            $scope.getTodaysStats(); // Get today's stats after loading order details
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

    // Function to group data by product category
    $scope.groupData = function() {
        const statsMap = {};
        $scope.categories.forEach(category => {
            statsMap[category.categoryname] = {
                categoryName: category.categoryname,
                totalQuantity: 0,
                totalRevenue: 0,
                price: 0,
            };
        });
        
        $scope.orderdetai.forEach(item => {
            if (statsMap[item.categoryName]) {
                statsMap[item.categoryName].totalQuantity += item.quantityInStock > 0 ? item.quantityInStock : 0; 
                statsMap[item.categoryName].totalRevenue += (item.price * item.quantityInStock);
                statsMap[item.categoryName].price = item.price;
            }
        });

        $scope.groupedOrderDetails = Object.values(statsMap);
        $scope.renderChart(); // Render chart after grouping data
    };

    // Function to render the pie chart
    $scope.renderChart = function() {
        if ($scope.groupedOrderDetails.length === 0) {
            document.getElementById("pie-chart").innerHTML = "";
            return;
        }

        var options = {
            series: $scope.groupedOrderDetails.map(item => item.totalQuantity),
            chart: {
                width: 480,
                type: 'pie',
            },
            labels: $scope.groupedOrderDetails.map(item => item.categoryName),
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        var chart = new ApexCharts(document.querySelector("#pie-chart"), options);
        chart.render();
    };

    // Function to fetch payment statuses
    $scope.getStatusPayments = function() {
        $http.get('http://localhost:8080/beesixcake/api/statuspay')
        .then(function(response) {
            $scope.statusPayments = response.data; // Store payment statuses
        })
        .catch(function(error) {
            console.error('Error fetching status payments:', error);
        });
    };

    // Function to fetch orders
    $scope.getOrders = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {  
            $scope.orders = response.data.map(function(item) {
                return {
                    date: new Date(item.orderdate).toISOString().split('T')[0],
                    total: item.total,
                    statusId: item.statuspay.idstatuspay
                };
            });
            $scope.filteredOrders = $scope.orders.filter(order => order.statusId === 2); // Filter paid orders
            $scope.calculateTotals(); // Calculate totals
        })
        .catch(function(error) {
            console.error('Error fetching orders:', error);
        });
    };

    // Function to get today's statistics
    $scope.getTodaysStats = function() {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

        const todaysOrders = $scope.orders.filter(order => order.date === formattedToday && order.statusId === 2);
        if (todaysOrders.length > 0) {
            $scope.todaysTotalOrders = todaysOrders.length;
            $scope.todaysTotalRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
        } else {
            $scope.todaysTotalOrders = 0;
            $scope.todaysTotalRevenue = 0;
        }
    };

    // Function to filter orders based on selected date range
    $scope.filterByDateRange = function() {
        const start = new Date($scope.startDate);
        const end = new Date($scope.endDate);
        
        if (!start || !end || start > end) {
            $scope.filteredOrders = $scope.orders.filter(order => order.statusId === 2);
        } else {
            $scope.filteredOrders = $scope.orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= start && orderDate <= end && order.statusId === 2;
            });
        }
        
        $scope.calculateTotals();
    };

    // Function to calculate total revenue and order count
    $scope.calculateTotals = function() {
        $scope.totalRevenue = $scope.filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        $scope.totalOrdersCount = $scope.filteredOrders.length;
    };

    // Function to format currency
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Initialize data
    $scope.getCategories(); // Fetch categories
    $scope.getStatusPayments(); // Fetch payment statuses
    $scope.getOrders(); // Fetch orders
});

app.controller('dayController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Dữ liệu đã lọc
    $scope.dailyStats = []; // Thống kê theo ngày
    $scope.selectedDate = null; // Ngày được chọn
    $scope.statusPayments = []; // Lưu trạng thái thanh toán
    $scope.availableDates = []; // Danh sách các ngày có sẵn

    // Hàm lấy dữ liệu trạng thái thanh toán
    $scope.getStatusPayments = function() {
        $http.get('http://localhost:8080/beesixcake/api/statuspay')
        .then(function(response) {
            $scope.statusPayments = response.data; // Lưu danh sách trạng thái thanh toán
        })
        .catch(function(error) {
            console.error('Lỗi khi lấy dữ liệu trạng thái thanh toán:', error);
        });
    };

    // Hàm lấy dữ liệu đơn hàng từ API
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {  
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate);
                return {
                    date: orderDate.toISOString().split('T')[0], // Ngày theo định dạng YYYY-MM-DD
                    total: item.total,
                    statusId: item.statuspay.idstatuspay,
                };
            });
            
            // Tạo danh sách các ngày có sẵn
            $scope.availableDates = [...new Set($scope.orderdetai.map(item => item.date))];
            $scope.filterData(); // Lọc dữ liệu cho ngày hiện tại
        })
        .catch(function(error) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
        });
    };

    // Hàm lọc dữ liệu theo ngày hiện tại
    $scope.filterData = function() {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0]; // Định dạng ngày hôm nay

        // Lọc đơn hàng cho ngày hôm nay
        $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
            return item.date === formattedToday && item.statusId === 2;
        });

        $scope.calculateDailyStats();
        $scope.renderDailyChart();
    };

    // Hàm tính toán thống kê theo ngày
    $scope.calculateDailyStats = function() {
        $scope.dailyStats = [];
        const statsMap = {};
        $scope.filteredOrderDetails.forEach(function(item) {
            if (!statsMap[item.date]) {
                statsMap[item.date] = {
                    date: item.date,
                    totalOrders: 0,
                    totalRevenue: 0
                };
            }
            statsMap[item.date].totalOrders += 1;
            statsMap[item.date].totalRevenue += item.total;
        });

        $scope.dailyStats = Object.values(statsMap);
        
        // Nếu không có đơn hàng, thêm một trường để hiển thị
        if ($scope.dailyStats.length === 0) {
            $scope.dailyStats.push({
                date: formattedToday,
                totalOrders: 0,
                totalRevenue: 0
            });
        }
    };

    // Hàm vẽ biểu đồ theo ngày
    $scope.renderDailyChart = function() {
        if ($scope.dailyStats.length === 0 || $scope.dailyStats[0].totalOrders === 0) {
            document.getElementById("daily-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }

        document.getElementById("daily-bar-chart").innerHTML = "";

        var options = {
            series: [{
                name: 'Tổng Đơn Hàng',
                data: $scope.dailyStats.map(stat => stat.totalOrders),
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: '30%'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                }
            },
            xaxis: {
                categories: $scope.dailyStats.map(stat => stat.date),
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        var chart = new ApexCharts(document.querySelector("#daily-bar-chart"), options);
        chart.render();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getStatusPayments();
    $scope.getDiscounts();
});