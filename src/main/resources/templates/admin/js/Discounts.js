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
    // Lấy danh sách loại sản phẩm từ API
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/discount')
            .then(function(response) {
                $scope.Discounts = response.data; // Lưu danh sách loại sản phẩm
            }, function(error) {
                console.log('Error fetching categories:', error);
            });
    };

    // Hàm kiểm tra và cập nhật phần trăm giảm giá
    $scope.updateDiscountPercentage = function() {
        var lowestPrice = parseFloat($scope.selecteddiscount.lowestprice); // Chuyển đổi thành số
        if (lowestPrice >= 30000) {
            $scope.selecteddiscount.discountpercentage = 5; // Đặt phần trăm giảm giá là 5%
        } else if (lowestPrice < 30 && $scope.selecteddiscount.discountpercentage !== null) {
            // Nếu giá trị dưới  30,000 và phần trăm giảm giá đã được xác định trước đó
            // Giữ nguyên giá trị hiện tại của phần trăm giảm giá
            $scope.selecteddiscount.discountpercentage = $scope.selecteddiscount.discountpercentage; 
        }
    };

    // Cập nhật khi người dùng thay đổi mức giá tối thiểu
    $scope.$watch('selecteddiscount.lowestprice', function(newValue) {
        $scope.updateDiscountPercentage();
    });

    // Thêm loại sản phẩm mới
    $scope.adddiscount = function() {
        // Kiểm tra nếu ngày bắt đầu lớn hơn ngày kết thúc
        if (!$scope.selecteddiscount.startdate || !$scope.selecteddiscount.enddate) {
            alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.');
            return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
        }
        
        if ($scope.selecteddiscount.startdate > $scope.selecteddiscount.enddate) {
            alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc. Vui lòng kiểm tra lại.');
            return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
        }
    
        // Kiểm tra nếu phần trăm giảm giá lớn hơn 50%
        if ($scope.selecteddiscount.discountpercentage > 50) {
            alert('Phần trăm giảm giá không được vượt quá 50%.');
            return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
        }
    
        var newdiscount = {
            discountcode: $scope.selecteddiscount.discountcode,
            discountpercentage: $scope.selecteddiscount.discountpercentage,
            startdate: $scope.selecteddiscount.startdate.toISOString(), // Chuyển đổi thành chuỗi ISO
            enddate: $scope.selecteddiscount.enddate.toISOString(),     // Chuyển đổi thành chuỗi ISO
            lowestprice: parseFloat($scope.selecteddiscount.lowestprice) || 0 // Chuyển đổi thành số
        };
    
        $http.post('http://localhost:8080/beesixcake/api/discount', newdiscount)
            .then(function(response) {
                alert('Thêm khuyến mãi thành công!');
                $scope.getDiscounts(); // Tải lại danh sách sau khi thêm
                $scope.resetForm(); // Làm mới form
            }, function(error) {
                console.log('Error adding discount:', error);
            });
    };

    // Chỉnh sửa loại sản phẩm
    $scope.editdiscount = function() {
        // Kiểm tra nếu ngày bắt đầu lớn hơn ngày kết thúc
        if ($scope.selecteddiscount.startdate > $scope.selecteddiscount.enddate) {
            alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc. Vui lòng kiểm tra lại.');
            return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
        }
    
        // Kiểm tra phần trăm giảm giá không vượt quá 50%
        if ($scope.selecteddiscount.discountpercentage > 50) {
            alert('Phần trăm giảm giá không được vượt quá 50%.');
            return; // Dừng thực hiện hàm nếu điều kiện không thỏa mãn
        }
    
        var editeddiscount = {
            iddiscount: $scope.selecteddiscount.iddiscount,
            discountcode: $scope.selecteddiscount.discountcode,
            discountpercentage: $scope.selecteddiscount.discountpercentage,
            startdate: $scope.selecteddiscount.startdate.toISOString(), // Chuyển đổi thành chuỗi ISO
            enddate: $scope.selecteddiscount.enddate.toISOString(),     // Chuyển đổi thành chuỗi ISO
            lowestprice: parseFloat($scope.selecteddiscount.lowestprice) || 0 // Chuyển đổi thành số
        };
    
        $http.put('http://localhost:8080/beesixcake/api/discount/' + editeddiscount.iddiscount, editeddiscount)
            .then(function(response) {
                alert('Sửa khuyến mãi thành công!');
                $scope.getDiscounts(); // Tải lại danh sách sau khi sửa
                $scope.resetForm(); // Làm mới form
            }, function(error) {
                console.log('Error editing discount:', error);
                alert('Có lỗi xảy ra khi sửa khuyến mãi. Vui lòng thử lại.');
            });
    };

    // Xóa khuyến mãi
    $scope.deletediscount = function(discount) {
        if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/discount/' + discount.iddiscount)
                .then(function(response) {
                    alert('Xóa khuyến mãi thành công!');
                    $scope.getDiscounts(); // Tải lại danh sách sau khi xóa
                }, function(error) {
                    console.log('Error deleting category:', error);
                });
        }
    };
 // Hàm định dạng tiền tệ
 $scope.formatCurrency = function(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
    // Chuyển dữ liệu khuyến mãi vào form để chỉnh sửa
  // Chuyển dữ liệu khuyến mãi vào form để chỉnh sửa
$scope.goToEdit = function(discount) {
    $scope.selecteddiscount = angular.copy(discount);
    // Chuyển đổi các trường ngày sang đối tượng Date
    if (discount.startdate) {
        $scope.selecteddiscount.startdate = new Date(discount.startdate);
    }
    if (discount.enddate) {
        $scope.selecteddiscount.enddate = new Date(discount.enddate);
    }
};

    // Làm mới form
    $scope.resetForm = function() {
        $scope.selecteddiscount = {};
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getDiscounts();
});