
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
    $scope.filteredOrderDetails = []; // Dữ liệu đã lọc
    $scope.dailyStats = []; // Thống kê theo ngày
    $scope.selectedMonth = null; // Tháng được chọn
    $scope.selectedYear = null; // Năm được chọn
    $scope.statusPayments = []; // Lưu trạng thái thanh toán
    $scope.availableMonths = []; // Danh sách các tháng có sẵn
    $scope.availableYears = []; // Danh sách các năm có sẵn

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
                    month: orderDate.getMonth() + 1, // Lấy tháng (0-11) và cộng 1
                    year: orderDate.getFullYear(), // Lấy năm
                    total: item.total,
                    statusId: item.statuspay.idstatuspay,
                };
            });

            // Tạo danh sách các tháng và năm có sẵn từ dữ liệu
            $scope.availableMonths = [...new Set($scope.orderdetai.map(item => item.month))].sort();
            $scope.availableYears = [...new Set($scope.orderdetai.map(item => item.year))].sort();

            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
            $scope.calculateDailyStats();
            $scope.renderDailyChart();
        })
        .catch(function(error) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
        });
    };

    // Hàm lọc dữ liệu theo tháng và năm
    $scope.filterData = function() {
        if (!$scope.selectedMonth && !$scope.selectedYear) {
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
        } else {
            $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
                return (item.month == $scope.selectedMonth || !$scope.selectedMonth) &&
                       (item.year == $scope.selectedYear || !$scope.selectedYear) &&
                       (item.statusId === 2);
            });
        }

        $scope.calculateDailyStats();
        $scope.renderDailyChart();
    };

    // Hàm tính toán thống kê theo ngày
    $scope.calculateDailyStats = function() {
        $scope.dailyStats = [];
        const statsMap = {};

        // Tạo mảng chứa 30 ngày
        const currentMonth = $scope.selectedMonth || new Date().getMonth() + 1;
        const currentYear = $scope.selectedYear || new Date().getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // Số ngày trong tháng

        for (let day = 1; day <= daysInMonth; day++) {
            const formattedDate = `${currentYear} ${day}`; // Định dạng lại ngày
            statsMap[formattedDate] = {
                date: formattedDate,
                totalOrders: 0,
                totalRevenue: 0
            };
        }

        // Nhóm dữ liệu theo ngày
        $scope.filteredOrderDetails.forEach(function(item) {
            const orderDate = new Date(item.date);
            const day = orderDate.getDate(); // Lấy ngày của tháng
            const formattedDate = `${orderDate.getFullYear()} ${day}`; // Định dạng lại ngày

            statsMap[formattedDate].totalOrders += 1;
            statsMap[formattedDate].totalRevenue += item.total;
        });

        // Chuyển đổi đối tượng thành mảng
        $scope.dailyStats = Object.values(statsMap);
    };

    // Hàm vẽ biểu đồ theo ngày
    $scope.renderDailyChart = function() {
        if ($scope.dailyStats.length === 0) {
            document.getElementById("daily-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }

        document.getElementById("daily-bar-chart").innerHTML = "";

        var options = {
            series: [{
                name: 'Doanh Thu',
                data: $scope.dailyStats.map(stat => stat.totalRevenue), // Sử dụng tổng doanh thu
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: '100%'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '70%',
                }
            },
            xaxis: {
                categories: $scope.dailyStats.map(stat => ` ${stat.date.split(' ')[1]}`), // Sử dụng ngày
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