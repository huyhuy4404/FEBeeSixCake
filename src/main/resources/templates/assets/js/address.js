var app = angular.module('myApp', []);

app.controller('AddressController', function($scope, $http) {
    // Khởi tạo danh sách địa chỉ
    $scope.userAddresses = [];
    $scope.userAddress = {}; // Khởi tạo đối tượng địa chỉ mới

    // Hàm lấy thông tin tài khoản đăng nhập
    $scope.getUserInfo = function() {
        var loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            $scope.loggedInUser = JSON.parse(loggedInUser);
        } else {
            $scope.loggedInUser = null;
        }
    };
 
    // Hàm thêm địa chỉ mới
    $scope.addAddress = function () {
        if ($scope.loggedInUser && $scope.loggedInUser.idaccount) {
            $scope.userAddress.account = {
                idaccount: $scope.loggedInUser.idaccount
            };
        } else {
            console.error('ID tài khoản không hợp lệ.');
            return;
        }

        // Gửi yêu cầu POST đến API để thêm địa chỉ
        $http.post('http://localhost:8080/beesixcake/api/address', $scope.userAddress)
            .then(function (response) {
                $scope.userAddresses.push(response.data); // Thêm địa chỉ mới vào danh sách
                $scope.userAddress = {}; // Reset form sau khi thêm thành công
                console.log('Đã thêm địa chỉ thành công:', response.data);
            })
            .catch(function (error) {
                console.error('Lỗi khi thêm địa chỉ:', error);
            });
    };

    // Hàm khởi tạo danh sách địa chỉ
   
    
    $scope.editAddress = function(address) {
        $scope.userAddress = angular.copy(address); // Gán thông tin địa chỉ vào form
    };

    $scope.updateAddress = function() {
        // Kiểm tra xem ID địa chỉ đã được chọn
        if (!$scope.userAddress.idaddress) {
            console.error('ID địa chỉ không hợp lệ.');
            return;
        }
    
        // Gửi yêu cầu PUT để cập nhật địa chỉ
        $http.put('http://localhost:8080/beesixcake/api/address/' + $scope.userAddress.idaddress, $scope.userAddress)
            .then(function(response) {
                // Cập nhật danh sách địa chỉ
                var index = $scope.userAddresses.findIndex(function(address) {
                    return address.idaddress === $scope.userAddress.idaddress;
                });
                if (index !== -1) {
                    $scope.userAddresses[index] = response.data; // Cập nhật địa chỉ trong danh sách
                }
                $scope.userAddress = {}; // Reset form sau khi cập nhật thành công
                console.log('Đã cập nhật địa chỉ thành công:', response.data);
            })
            .catch(function(error) {
                console.error('Lỗi khi cập nhật địa chỉ:', error);
            });
    };
    
    $scope.deleteAddress = function(address) {
        // Kiểm tra xem địa chỉ có hợp lệ không và có idaddress
        if (address && address.idaddress) {
            // Xác nhận trước khi xóa
            if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) {
                // Gửi yêu cầu DELETE đến API để xóa địa chỉ theo idaddress
                $http.delete('http://localhost:8080/beesixcake/api/address/' + address.idaddress)
                    .then(function(response) {
                        if (response.status === 200) {
                            // Tìm và xóa địa chỉ khỏi mảng userAddresses
                            var index = $scope.userAddresses.findIndex(function(item) {
                                return item.idaddress === address.idaddress;
                            });
                            if (index !== -1) {
                                $scope.userAddresses.splice(index, 1); // Xóa địa chỉ khỏi mảng
                            }
                            console.log('Đã xóa địa chỉ thành công:', address.idaddress);
                        } else {
                            console.error('Lỗi khi xóa địa chỉ:', response.data);
                        }
                    })
                    .catch(function(error) {
                        console.error('Lỗi khi xóa địa chỉ:', error);
                    });
            }
        } else {
            console.error('Địa chỉ không hợp lệ:', address); // Thông báo lỗi nếu địa chỉ không hợp lệ
        }
       
    };
    
    
    $scope.loadAddresses = function() {
        // Lấy ID tài khoản đã đăng nhập
        var idAccount = $scope.loggedInUser.idaccount;
    
        // Gửi yêu cầu GET đến API để lấy danh sách địa chỉ
        $http.get('http://localhost:8080/beesixcake/api/address')
            .then(function(response) {
                // Lọc các địa chỉ chỉ cho ID tài khoản đã đăng nhập
                $scope.userAddresses = response.data.filter(function(address) {
                    return address.account.idaccount === idAccount;
                });
            })
            .catch(function(error) {
                console.error('Lỗi khi lấy danh sách địa chỉ:', error);
            });
    };
    
    
    // Gọi hàm để lấy thông tin tài khoản và địa chỉ khi trang tải
    $scope.getUserInfo();
    $scope.loadAddresses();
});
