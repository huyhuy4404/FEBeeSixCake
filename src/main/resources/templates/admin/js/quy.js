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
    $scope.orders = [];
    $scope.filteredOrderDetails = [];
    $scope.quarterlyStats = [];
    $scope.selectedYear = new Date().getFullYear(); // Mặc định là năm hiện tại
    $scope.chart = null; // Biến để lưu trữ biểu đồ

    // Hàm lấy dữ liệu đơn hàng
    $scope.getOrders = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {
            console.log(response.data);
            $scope.orders = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate);
                return {
                    date: orderDate.toISOString().split('T')[0],
                    month: orderDate.getMonth() + 1,
                    year: orderDate.getFullYear(),
                    total: item.total,
                    statusId: item.statuspay.idstatuspay
                };
            });

            // Lọc đơn hàng theo năm đã chọn
            $scope.filterByYear();
        })
        .catch(function(error) {
            console.error('Error fetching orders:', error);
        });
    };

    // Hàm lọc dữ liệu theo năm
    $scope.filterByYear = function() {
        // Lọc đơn hàng theo năm đã chọn
        $scope.filteredOrderDetails = $scope.orders.filter(item => item.year === $scope.selectedYear && item.statusId === 2);
        console.log('Filtered Orders:', $scope.filteredOrderDetails); // Kiểm tra dữ liệu đã lọc
        $scope.calculateQuarterlyStats();
        $scope.renderChart();
    };

    // Hàm tính toán thống kê theo quý
    $scope.calculateQuarterlyStats = function() {
        // Khởi tạo thống kê quý cho năm đã chọn
        $scope.quarterlyStats = [
            { quarter: 1, year: $scope.selectedYear, totalQuantity: 0, totalRevenue: 0 },
            { quarter: 2, year: $scope.selectedYear, totalQuantity: 0, totalRevenue: 0 },
            { quarter: 3, year: $scope.selectedYear, totalQuantity: 0, totalRevenue: 0 },
            { quarter: 4, year: $scope.selectedYear, totalQuantity: 0, totalRevenue: 0 }
        ];

        // Nhóm dữ liệu theo quý cho năm đã chọn
        $scope.filteredOrderDetails.forEach(function(item) {
            var quarter = Math.ceil(item.month / 3);
            var stat = $scope.quarterlyStats.find(s => s.quarter === quarter && s.year === $scope.selectedYear);
            if (stat) {
                stat.totalQuantity += 1;
                stat.totalRevenue += item.total;
            }
        });

        console.log('Quarterly Stats:', $scope.quarterlyStats); // Kiểm tra thống kê quý
    };

    // Hàm vẽ biểu đồ
    $scope.renderChart = function() {
        // Nếu không có dữ liệu, hiển thị thông báo
        if ($scope.quarterlyStats.length === 0 || $scope.quarterlyStats.every(stat => stat.totalRevenue === 0)) {
            document.getElementById("bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }
    
        // Tính toán giá trị tối đa cho số lượng đơn hàng và doanh thu
        const maxQuantity = Math.max(...$scope.quarterlyStats.map(stat => stat.totalQuantity)) || 0;
        const maxRevenue = Math.max(...$scope.quarterlyStats.map(stat => stat.totalRevenue)) || 0;
    
        // Cập nhật biểu đồ nếu đã tồn tại
        if ($scope.chart) {
            $scope.chart.updateOptions({
                series: [
                    {
                        name: 'Số Lượng Đơn Hàng',
                        data: $scope.quarterlyStats.map(stat => stat.totalQuantity)
                    },
                    {
                        name: 'Doanh Thu',
                        data: $scope.quarterlyStats.map(stat => stat.totalRevenue)
                    }
                ],
                xaxis: {
                    categories: $scope.quarterlyStats.map(stat => `Quý ${stat.quarter} ${stat.year}`)
                },
                yaxis: [
                    {
                        max: maxQuantity + 10 // Giới hạn tối đa cho trục y số lượng đơn hàng
                    },
                    {
                        opposite: true,
                        max: maxRevenue + 10 // Giới hạn tối đa cho trục y doanh thu
                    }
                ]
            });
        } else {
            // Tạo biểu đồ mới nếu chưa có
            var options = {
                series: [
                    {
                        name: 'Số Lượng Đơn Hàng',
                        data: $scope.quarterlyStats.map(stat => stat.totalQuantity)
                    },
                    {
                        name: 'Doanh Thu',
                        data: $scope.quarterlyStats.map(stat => stat.totalRevenue)
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
                stroke: {
                    width: 2,
                    colors: ['#007bff', '#00aaff']
                },
                xaxis: {
                    categories: $scope.quarterlyStats.map(stat => `Quý ${stat.quarter} ${stat.year}`)
                },
                yaxis: [
                    {
                        title: {
                            text: 'Số lượng Đơn Hàng'
                        },
                        min: 0,
                        max: maxQuantity + 10, // Giới hạn tối đa cho trục y số lượng đơn hàng
                        labels: {
                            formatter: function(value) {
                                return value;
                            }
                        }
                    },
                    {
                        opposite: true,
                        title: {
                            text: 'Doanh Thu (VND)'
                        },
                        max: maxRevenue + 10, // Giới hạn tối đa cho trục y doanh thu
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
                    formatter: function(series) {
                        return series.map((s, index) => {
                            const quantity = $scope.quarterlyStats[index].totalQuantity;
                            const revenue = $scope.formatCurrency($scope.quarterlyStats[index].totalRevenue);
                            return `Quý ${$scope.quarterlyStats[index].quarter} ${$scope.quarterlyStats[index].year}<br>Số lượng: ${quantity}<br>Doanh thu: ${revenue}`;
                        }).join('<br>');
                    }
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
    
            // Tạo biểu đồ mới
            $scope.chart = new ApexCharts(document.querySelector("#bar-chart"), options);
            $scope.chart.render();
        }
    };
    $scope.exportToExcel = function() {
        // Tạo một workbook mới
        const wb = XLSX.utils.book_new();
        
        // Tạo dữ liệu cho bảng
        const data = [
            ["Quý", "Tổng Số Lượng", "Tổng Doanh Thu"]
        ];
    
        // Thêm dữ liệu thống kê vào bảng
        $scope.quarterlyStats.forEach(stat => {
            data.push([`Quý ${stat.quarter} ${stat.year}`, stat.totalQuantity, stat.totalRevenue]);
        });
    
        // Tạo worksheet từ dữ liệu
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Doanh Thu");
        const columnWidths = [
            { wch: 15 }, // Chiều rộng cột ngày
            { wch: 15 }, // Chiều rộng cột tổng đơn hàng
            { wch: 15 }  // Chiều rộng cột tổng tiền
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
        // Xuất file Excel
        XLSX.writeFile(wb, `Doanh_Thu_Theo_Quy_${$scope.selectedYear}.xlsx`);
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getOrders();
});