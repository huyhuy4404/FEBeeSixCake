var app = angular.module('myApp', []);

app.controller('AddressController', function ($scope, $http) {
    // Khởi tạo mảng chứa thông tin địa chỉ
    $scope.userAddresses = [];
    $scope.userAddress = {}; // Để chứa địa chỉ hiện tại

    // Hàm để lấy danh sách địa chỉ từ API
    $scope.getAddresses = function () {
        $http.get('http://localhost:8080/beesixcake/api/address')
            .then(function (response) {
                $scope.userAddresses = response.data; // Gán dữ liệu vào mảng userAddresses
            })
            .catch(function (error) {
                console.error('Error fetching addresses:', error);
            });
    };

    // Hàm để thêm địa chỉ
 $scope.addAddress = function () {
    if ($scope.userAddress.housenumber && $scope.userAddress.roadname && 
        $scope.userAddress.ward && $scope.userAddress.district && 
        $scope.userAddress.city) {
        
        // Thêm thông tin tài khoản vào userAddress
        $scope.userAddress.account = {
            idaccount: "1", // Hoặc giá trị ID tài khoản mà bạn muốn sử dụng
            // Các thông tin khác của tài khoản nếu cần thiết
        };

        $http.post('http://localhost:8080/beesixcake/api/address', $scope.userAddress)
            .then(function (response) {
                // Cập nhật lại danh sách địa chỉ sau khi thêm
                $scope.getAddresses();
                $scope.cancelEdit(); // Hủy chỉnh sửa
                alert('Địa chỉ đã được thêm thành công!');
            })
            .catch(function (error) {
                console.error('Error adding address:', error);
                alert('Có lỗi xảy ra khi thêm địa chỉ.');
            });
    } else {
        alert('Vui lòng điền đầy đủ thông tin.');
    }
};

    

    // Hàm để chỉnh sửa địa chỉ
    $scope.editAddress = function (address) {
        $scope.userAddress = angular.copy(address); // Sao chép địa chỉ cần chỉnh sửa vào userAddress
    };

    // Hàm để hủy chỉnh sửa
    $scope.cancelEdit = function () {
        $scope.userAddress = {}; // Đặt userAddress về trạng thái ban đầu
    };

    // Hàm để xóa địa chỉ
    $scope.deleteAddress = function (address) {
        if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) {
            $http.delete(`http://localhost:8080/beesixcake/api/address/${address.idaddress}`)
                .then(function (response) {
                    // Cập nhật lại danh sách địa chỉ sau khi xóa
                    $scope.getAddresses();
                    alert('Địa chỉ đã được xóa thành công!');
                })
                .catch(function (error) {
                    console.error('Error deleting address:', error);
                });
        }
    };

    // Hàm để cập nhật địa chỉ
    $scope.updateAddress = function () {
        $http.put(`http://localhost:8080/beesixcake/api/address/${$scope.userAddress.idaddress}`, $scope.userAddress)
            .then(function (response) {
                // Cập nhật lại danh sách địa chỉ sau khi sửa
                $scope.getAddresses();
                $scope.cancelEdit(); // Hủy chỉnh sửa
                alert('Địa chỉ đã được cập nhật thành công!');
            })
            .catch(function (error) {
                console.error('Error updating address:', error);
            });
    };

    // Gọi hàm để lấy danh sách địa chỉ khi controller được khởi tạo
    $scope.getAddresses();
});
