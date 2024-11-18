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
    $scope.categories = []; // Danh sách loại sản phẩm

    $scope.orders = []; // Danh sách đơn hàng
    $scope.filteredOrders = []; // Danh sách đơn hàng đã lọc
    $scope.totalRevenue = 0; // Tổng doanh thu
    $scope.totalOrdersCount = 0; // Tổng số đơn hàng
    $scope.statusPayments = []; // Biến lưu trạng thái thanh toán

    // Hàm lấy dữ liệu loại sản phẩm
    $scope.getCategories = function() {
        $http.get('http://localhost:8080/beesixcake/api/category')
        .then(function(response) {
            $scope.categories = response.data; // Lưu danh sách loại sản phẩm vào biến
            $scope.getDiscounts(); // Lấy dữ liệu giảm giá sau khi đã có loại sản phẩm
        })
        .catch(function(error) {
            console.error('Error fetching categories:', error);
        });
    };

    // Hàm lấy dữ liệu sản phẩm
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/productdetail') // Cập nhật URL API
        .then(function(response) {
            console.log(response.data); // Kiểm tra dữ liệu trả về
            $scope.orderdetai = response.data.map(function(item) {
                return {
                    categoryName: item.product.category.categoryname, // Cập nhật đường dẫn nếu cần
                    price: item.unitprice, // Cập nhật nếu cần
                    quantityInStock: item.quantityinstock, // Cập nhật nếu cần
                    productId: item.idproduct, // Cập nhật nếu cần
                };
            });
    
            console.log($scope.orderdetai); // Kiểm tra dữ liệu đã được xử lý
            $scope.groupData(); // Nhóm dữ liệu sau khi đã lấy thông tin
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

    // Hàm nhóm dữ liệu theo loại sản phẩm
    $scope.groupData = function() {
        const statsMap = {};
    
        // Tạo một đối tượng cho mỗi loại sản phẩm
        $scope.categories.forEach(category => {
            statsMap[category.categoryname] = {
                categoryName: category.categoryname,
                totalQuantity:  0,
                totalRevenue: 0,
                price: 0,
            };
        });
    
        // Cập nhật thông tin sản phẩm từ orderdetai
        $scope.orderdetai.forEach(item => {
            if (statsMap[item.categoryName]) {
                // Cập nhật số lượng tồn kho
                statsMap[item.categoryName].totalQuantity += item.quantityInStock > 0 ? item.quantityInStock : 0; 
                // Tính doanh thu
                statsMap[item.categoryName].totalRevenue += (item.price * item.quantityInStock);
                // Lưu giá của sản phẩm
                statsMap[item.categoryName].price = item.price;
            }
        });
    
        // Chuyển đổi đối tượng thành mảng
        $scope.groupedOrderDetails = Object.values(statsMap);
        $scope.renderChart(); // Vẽ biểu đồ sau khi đã nhóm dữ liệu
        console.log($scope.groupedOrderDetails); // Kiểm tra dữ liệu nhóm
    };
    // Hàm vẽ biểu đồ
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
 // Hàm lấy dữ liệu trạng thái thanh toán
 $scope.getStatusPayments = function() {
  $http.get('http://localhost:8080/beesixcake/api/statuspay')
  .then(function(response) {
      $scope.statusPayments = response.data; // Lưu danh sách trạng thái thanh toán
      console.log('Status Payments:', $scope.statusPayments); // Kiểm tra dữ liệu
  })
  .catch(function(error) {
      console.error('Error fetching status payments:', error);
  });
};

// Hàm lấy dữ liệu đơn hàng
$scope.getOrders = function() {
  $http.get('http://localhost:8080/beesixcake/api/order')
  .then(function(response) {  
      console.log(response.data); // Kiểm tra dữ liệu nhận được
      $scope.orders = response.data.map(function(item) {
          return {
              date: new Date(item.orderdate).toISOString().split('T')[0],
              total: item.total, // Lưu tổng tiền từ đơn hàng
              statusId: item.idstatuspay // Lưu ID trạng thái thanh toán
          };
      });
      $scope.filteredOrders = $scope.orders.filter(order => order.statusId === 2); // Lọc đơn hàng đã thanh toán
      $scope.calculateTotals(); // Tính tổng tiền và số đơn hàng
  })
  .catch(function(error) {
      console.error('Error fetching orders:', error);
  });
};

// Hàm tính tổng tiền và tổng số đơn hàng
$scope.calculateTotals = function() {
  $scope.totalRevenue = $scope.filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  $scope.totalOrdersCount = $scope.filteredOrders.length;
  console.log('Tổng doanh thu:', $scope.totalRevenue); // Kiểm tra tổng doanh thu
  console.log('Tổng số đơn hàng:', $scope.totalOrdersCount); // Kiểm tra tổng số đơn hàng
};

// Hàm định dạng tiền tệ
$scope.formatCurrency = function(amount) {
  if (isNaN(amount)) {
      return '0 ₫'; // Hoặc một giá trị mặc định
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
    

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy danh sách loại sản phẩm
    $scope.getCategories(); // Lấy dữ liệu loại sản phẩm
    $scope.getStatusPayments(); // Lấy dữ liệu trạng thái thanh toán
    $scope.getOrders(); // Lấy dữ liệu đơn hàng
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
          console.log('Trạng thái thanh toán:', $scope.statusPayments);
      })
      .catch(function(error) {
          console.error('Lỗi khi lấy dữ liệu trạng thái thanh toán:', error);
      });
  };

  // Hàm lấy dữ liệu đơn hàng từ API
  $scope.getDiscounts = function() {
      $http.get('http://localhost:8080/beesixcake/api/order')
      .then(function(response) {  
          console.log(response.data);
          $scope.orderdetai = response.data.map(function(item) {
              var orderDate = new Date(item.orderdate);
              return {
                  date: orderDate.toISOString().split('T')[0], // Ngày theo định dạng YYYY-MM-DD
                  total: item.total,
                  statusId: item.idstatuspay,
              };
          });
          
          // Tạo danh sách các ngày có sẵn với định dạng "YYYY DD"
          $scope.availableDates = [...new Set($scope.orderdetai.map(item => {
              const dateParts = item.date.split('-'); // Tách thành phần ngày
              return `${dateParts[0]} ${dateParts[2]}`; // Hiển thị năm trước rồi đến ngày
          }))];

          $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
          $scope.calculateDailyStats();
          $scope.renderDailyChart();
      })
      .catch(function(error) {
          console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
      });
  };

  // Hàm lọc dữ liệu theo ngày
  $scope.filterData = function() {
      console.log('Ngày đã chọn:', $scope.selectedDate);
      if (!$scope.selectedDate) {
          $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
      } else {
          $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
              const dateParts = item.date.split('-'); // Tách thành phần ngày
              const formattedDate = `${dateParts[0]} ${dateParts[2]}`; // Định dạng lại ngày
              return formattedDate === $scope.selectedDate && item.statusId === 2;
          });
      }

      console.log('Chi tiết đơn hàng đã lọc:', $scope.filteredOrderDetails);
      $scope.calculateDailyStats();
      $scope.renderDailyChart();
  };

  // Hàm tính toán thống kê theo ngày
  $scope.calculateDailyStats = function() {
      $scope.dailyStats = [];
      const statsMap = {};
      $scope.filteredOrderDetails.forEach(function(item) {
          const dateParts = item.date.split('-'); // Tách thành phần ngày
          const formattedDate = `${dateParts[0]} ${dateParts[2]}`; // Định dạng lại ngày
          if (!statsMap[formattedDate]) {
              statsMap[formattedDate] = {
                  date: formattedDate,
                  totalOrders: 0,
                  totalRevenue: 0
              };
          }
  
          statsMap[formattedDate].totalOrders += 1;
          statsMap[formattedDate].totalRevenue += item.total;
      });

      $scope.dailyStats = Object.values(statsMap);
      console.log('Thống kê hàng ngày sau khi tính toán:', $scope.dailyStats);
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
              name: 'Tổng Đơn Hàng',
              data: $scope.dailyStats.map(stat => stat.totalOrders),
          }],
          chart: {
              type: 'bar',
              height: 300,
              width: '100%'
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