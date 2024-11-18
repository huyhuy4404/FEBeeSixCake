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
    $scope.orders = []; // Thay đổi tên biến thành orders
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.quarterlyStats = []; // Thống kê theo quý
    $scope.startDate = null; // Ngày bắt đầu
    $scope.endDate = null; // Ngày kết thúc

    // Hàm lấy dữ liệu đơn hàng
    $scope.getOrders = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orders = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate); // Lấy ngày đặt hàng từ đơn hàng
                return {
                    date: orderDate.toISOString().split('T')[0], // Lưu ngày theo định dạng YYYY-MM-DD
                    month: orderDate.getMonth() + 1, // Tháng (1-12)
                    year: orderDate.getFullYear(), // Năm
                    total: item.total, // Tổng tiền từ đơn hàng
                    statusId: item.idstatuspay // Lưu ID trạng thái thanh toán
                };
            });

            // Giả sử ID trạng thái "đã thanh toán" là 2
            $scope.filteredOrderDetails = $scope.orders.filter(item => item.statusId === 2); // Chỉ giữ sản phẩm đã thanh toán
            $scope.calculateQuarterlyStats(); // Tính toán thống kê theo quý
            $scope.renderChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching orders:', error);
        });
    };

    // Hàm tính toán thống kê theo quý
    $scope.calculateQuarterlyStats = function() {
        $scope.quarterlyStats = [];

        // Nhóm dữ liệu theo quý
        $scope.filteredOrderDetails.forEach(function(item) {
            var quarter = Math.ceil(item.month / 3); // Tính quý
            var year = item.year;

            // Tạo hoặc cập nhật đối tượng thống kê cho quý
            var stat = $scope.quarterlyStats.find(s => s.quarter === quarter && s.year === year);
            if (!stat) {
                stat = { quarter: quarter, year: year, totalQuantity: 0, totalRevenue: 0 };
                $scope.quarterlyStats.push(stat);
            }
            stat.totalQuantity += 1; // Tăng số lượng đơn hàng
            stat.totalRevenue += item.total; // Cộng tổng tiền từ trường total
        });

        console.log('Quarterly Stats:', $scope.quarterlyStats); // Kiểm tra dữ liệu thống kê
    };

    // Hàm xuất dữ liệu ra Excel
    $scope.exportToExcel = function() {
        const worksheet = XLSX.utils.json_to_sheet($scope.filteredOrderDetails.map(item => ({
            'Ngày tạo': item.date,
            'Tổng tiền': item.total
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

        // Xuất file
        XLSX.writeFile(workbook, 'order_details.xlsx');
    };

    // Hàm lọc dữ liệu theo ngày
    $scope.filterData = function() {
        $scope.filteredOrderDetails = $scope.orders.filter(function(item) {
            var itemDate = new Date(item.date);
            var start = $scope.startDate ? new Date($scope.startDate) : null;
            var end = $scope.endDate ? new Date($scope.endDate) : null;

            // Đặt giờ cho ngày bắt đầu và ngày kết thúc
            if (start) {
                start.setHours(0, 0, 0, 0); // Đầu ngày
            }
            if (end) {
                end.setHours(23, 59, 59, 999); // Cuối ngày
            }

            // Kiểm tra xem ngày sản phẩm có nằm trong khoảng không
            if (start && end) {
                return itemDate >= start && itemDate <= end;
            } else if (start) {
                return itemDate >= start;
            } else if (end) {
                return itemDate <= end;
            } else {
                return true; // Nếu không có ngày nào được chọn thì hiển thị tất cả
            }
        });

        // Tính toán thống kê theo quý sau khi lọc dữ liệu
        $scope.calculateQuarterlyStats();
        // Cập nhật biểu đồ sau khi lọc dữ liệu
        $scope.renderChart();
    };

    // Hàm vẽ biểu đồ
    $scope.renderChart = function() {
        // Nếu không có dữ liệu, không vẽ biểu đồ
        if ($scope.quarterlyStats.length === 0) {
            document.getElementById("bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>"; // Thông báo nếu không có dữ liệu
            return;
        }

        var options = {
            series: [{
                name: 'Tổng Số Lượng',
                data: $scope.quarterlyStats.map(stat => stat.totalQuantity), // Tổng số lượng cho từng quý
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: '100%' // Đặt chiều rộng biểu đồ là 100%
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                }
            },
            xaxis: {
                categories: $scope.quarterlyStats.map(stat => `Quý ${stat.quarter} ${stat.year}`), // Tên quý
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

        var chart = new ApexCharts(document.querySelector("#bar-chart"), options);
        chart.render();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getOrders(); // Gọi hàm lấy dữ liệu từ API order
});