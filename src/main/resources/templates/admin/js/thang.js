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
    $scope.monthlyStats = []; // Thống kê hàng tháng
    $scope.selectedYear = null; // Năm được chọn
    $scope.statusPayments = []; // Trạng thái thanh toán
    $scope.availableYears = []; // Danh sách các năm có sẵn

    // Hàm lấy dữ liệu trạng thái thanh toán
    $scope.getStatusPayments = function() {
        $http.get('http://localhost:8080/beesixcake/api/statuspay')
        .then(function(response) {
            $scope.statusPayments = response.data; // Lưu danh sách trạng thái thanh toán
            console.log('Status Payments:', $scope.statusPayments);
        })
        .catch(function(error) {
            console.error('Error fetching status payments:', error);
        });
    };

    // Hàm lấy dữ liệu đơn hàng từ API
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {
            console.log(response.data);
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate);
                var month = orderDate.getMonth() + 1;
                var year = orderDate.getFullYear();
    
                return {
                    date: orderDate.toISOString().split('T')[0],
                    month: month,
                    year: year,
                    addressDetail: item.addressdetail,
                    shipFee: item.shipfee,
                    total: item.total,
                    account: item.account.fullname,
                    paymentMethod: item.payment.paymentname,
                    statusId: item.statuspay.idstatuspay,
                };
            });
    
            // Lấy các năm duy nhất và sắp xếp theo thứ tự tăng dần
            $scope.availableYears = [...new Set($scope.orderdetai.map(item => item.year))].sort((a, b) => a - b); // Sắp xếp
        })
        .catch(function(error) {
            console.error('Error fetching order details:', error);
        });
    };

    // Hàm lọc dữ liệu theo năm
    $scope.filterData = function() {
        // Đặt lại monthlyStats và filteredOrderDetails trước khi lọc
        $scope.monthlyStats = [];
        $scope.filteredOrderDetails = [];
    
        if ($scope.selectedYear) {
            // Lọc dữ liệu cho năm được chọn
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => {
                return item.year == $scope.selectedYear && item.statusId === 2; // Trạng thái thanh toán là 2
            });
            
            // Tính toán thống kê tháng từ danh sách chi tiết đơn hàng đã lọc
            $scope.calculateMonthlyStats();
        } 
        
        $scope.renderMonthlyChart(); // Cập nhật biểu đồ
    };

    // Hàm tính toán thống kê hàng tháng
    $scope.calculateMonthlyStats = function() {
        const statsMap = {};
    
        // Nhóm dữ liệu theo tháng
        $scope.filteredOrderDetails.forEach(function(item) {
            var monthYear = `${item.year}-${item.month < 10 ? '0' + item.month : item.month}`;
    
            if (!statsMap[monthYear]) {
                statsMap[monthYear] = {
                    monthYear: monthYear,
                    totalOrders: 0,
                    totalRevenue: 0
                };
            }
    
            statsMap[monthYear].totalOrders += 1; // Cập nhật tổng đơn hàng
            statsMap[monthYear].totalRevenue += item.total; // Cập nhật tổng doanh thu
        });
    
        // Đảm bảo có các tháng từ 01 đến 12 trong năm đã chọn
        const currentYear = $scope.selectedYear;
        for (let month = 1; month <= 12; month++) {
            const monthYear = `${currentYear}-${month < 10 ? '0' + month : month}`;
            if (!statsMap[monthYear]) {
                statsMap[monthYear] = {
                    monthYear: monthYear,
                    totalOrders: 0,
                    totalRevenue: 0
                };
            }
        }
    
        // Chuyển đổi đối tượng thành mảng và sắp xếp theo thứ tự tháng
        $scope.monthlyStats = Object.values(statsMap).sort((a, b) => {
            return new Date(a.monthYear) - new Date(b.monthYear);
        });
    
        console.log('Monthly Stats after calculation:', $scope.monthlyStats); // Ghi lại thống kê đã tính toán
    };

    // Hàm vẽ biểu đồ hàng tháng
    $scope.renderMonthlyChart = function() {
        if ($scope.monthlyStats.length === 0) {
            document.getElementById("monthly-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }
    
        document.getElementById("monthly-bar-chart").innerHTML = "";
    
        // Tính toán giá trị tối đa cho tổng đơn hàng và tổng tiền
        const maxOrders = Math.max(...$scope.monthlyStats.map(stat => stat.totalOrders)) || 0;
        const maxRevenue = Math.max(...$scope.monthlyStats.map(stat => stat.totalRevenue)) || 0;
    
        var options = {
            series: [
                {
                    name: 'Tổng Đơn Hàng',
                    data: $scope.monthlyStats.map(stat => stat.totalOrders),
                },
                {
                    name: 'Tổng Tiền',
                    data: $scope.monthlyStats.map(stat => stat.totalRevenue),
                }
            ],
            chart: {
                type: 'bar',
                height: 300,
                width: '100%',
                zoom: {
                    enabled: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                    endingShape: 'rounded'
                }
            },
            xaxis: {
                categories: $scope.monthlyStats.map(stat => `Tháng ${stat.monthYear.split('-')[1]}`),
            },
            yaxis: [
                {
                    title: {
                        text: 'Tổng Đơn Hàng'
                    },
                    min: 0,
                    max: maxOrders + 10 // Giới hạn tối đa cho trục y tổng đơn hàng
                },
                {
                    title: {
                        text: 'Tổng Tiền (VND)'
                    },
                    opposite: true,
                    min: 0,
                    max: maxRevenue + 10, // Giới hạn tối đa cho trục y tổng tiền
                    labels: {
                        formatter: function(value) {
                            return $scope.formatCurrency(value);
                        }
                    }
                }
            ],
            tooltip: {
                shared: true,
                intersect: false,
                followCursor: true
            },
            dataLabels: {
                enabled: false
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
    
        var chart = new ApexCharts(document.querySelector("#monthly-bar-chart"), options);
        chart.render();
    };
    $scope.exportToExcel = function() {
        // Tạo một workbook mới
        const wb = XLSX.utils.book_new();
        
        // Tạo dữ liệu cho bảng
        const data = [
            ["Tháng", "Tổng Đơn Hàng", "Tổng Tiền"]
        ];
    
        // Thêm dữ liệu thống kê vào bảng
        $scope.monthlyStats.forEach(stat => {
            data.push([`Tháng ${stat.monthYear.split('-')[1]}`, stat.totalOrders, stat.totalRevenue]);
        });
    
        // Tạo worksheet từ dữ liệu
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Căn chỉnh kích thước cột
        const columnWidths = [
            { wch: 15 }, // Chiều rộng cột tháng
            { wch: 20 }, // Chiều rộng cột tổng đơn hàng
            { wch: 20 }  // Chiều rộng cột tổng tiền
        ];
        ws['!cols'] = columnWidths; // Gán kích thước cột cho worksheet
    
        // Định dạng cột tổng tiền
        for (let i = 1; i < data.length; i++) {
            const cellAddress = `C${i + 1}`; // Cột C cho tổng tiền
            ws[cellAddress] = {
                v: data[i][2], // Giá trị
                t: 'n', // Kiểu số
                z: '"₫"#,##0.00' // Định dạng tiền tệ với ký hiệu
            };
        }
    
        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Doanh Thu Tháng");
    
        // Xuất file Excel
        XLSX.writeFile(wb, `Doanh_Thu_Theo_Thang_${new Date().getFullYear()}.xlsx`);
    };
    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    $scope.formatCurrency = function(amount) {
        if (isNaN(amount)) {
            return '0 ₫'; // Hoặc một giá trị mặc định
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    // Gọi hàm để lấy dữ liệu
    $scope.getStatusPayments();
    $scope.getDiscounts();
});