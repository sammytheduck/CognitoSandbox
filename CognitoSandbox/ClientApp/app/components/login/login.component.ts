import { Component, NgModule } from '@angular/core';
import { AuthenticationDetails, CognitoUser, CognitoUserPool, CognitoUserSession, CognitoUserAttribute } from 'amazon-cognito-identity-js';
//import { CognitoAuth } from 'amazon-cognito-auth-js';
import { Http, RequestOptions, Headers } from '@angular/http'; // Http will be deprecated, use HttpClient after updating to latest version of Angular

@Component({
    selector: 'login',
    templateUrl: './login.component.html'
})
export class LoginComponent {

    private UserPoolId = 'us-west-2_PjxNTm8Q3';
    private ClientId = '4jprmdnlstp7cs0pje1mpkaeup';
    private PoolData = {
        UserPoolId: this.UserPoolId,
        ClientId: this.ClientId
    };

    public NewUserName: string = '';
    public NewUserPassword: string = '';

    public LoginUserName: string = '';
    public LoginUserPassword: string = '';

    public IdToken = '';

    public VehicleMakeSettings: any;
    public VehicleMakeSettings2: any;

    private http: Http;

    constructor(http: Http) {

        this.http = http;

        // https://github.com/aws/amazon-cognito-auth-js

        //let authData = {
        //    ClientId: '4jprmdnlstp7cs0pje1mpkaeup',
        //    AppWebDomain: 'paulspoolparty',
        //    TokenScopesArray: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
        //    RedirectUriSignIn: 'https://uw.primeautoloan.com',
        //    RedirectUriSignOut: 'https://www.google.com',
        //    IdentityProvider: '', // e.g. 'Facebook',
        //    UserPoolId: 'us-west-2_PjxNTm8Q3', // Your user pool id here
        //    AdvancedSecurityDataCollectionFlag: 'false', // e.g. true
        //    Storage: '' // OPTIONAL e.g. new CookieStorage(), to use the specified storage provided
        //};
        //let auth = new CognitoAuth(authData);
    }

    //https://docs.aws.amazon.com/cognito/latest/developerguide/using-amazon-cognito-user-identity-pools-javascript-examples.html

    public RegisterNewUser() {

        if (this.NewUserName.length == 0 || this.NewUserPassword.length == 0) {
            alert('username and password required');
            return;
        }

        let userPool = new CognitoUserPool(this.PoolData);

        let attributeList: CognitoUserAttribute[] = [];

        let dataEmail = {
            Name: 'email',
            Value: this.NewUserName
        };

        let dataPhoneNumber = {
            Name: 'phone_number',
            Value: '+18015551234'
        };

        let dataGivenName = {
            Name: 'given_name',
            Value: 'Paul'
        }

        let attributeEmail = new CognitoUserAttribute(dataEmail);
        let attributePhoneNumber = new CognitoUserAttribute(dataPhoneNumber);
        let attributeGivenName = new CognitoUserAttribute(dataGivenName);

        attributeList.push(attributeEmail);
        attributeList.push(attributePhoneNumber);
        attributeList.push(attributeGivenName);

        let cognitoUser: CognitoUser;
        userPool.signUp(this.NewUserName, this.NewUserPassword, attributeList, new Array<CognitoUserAttribute>(), function (err, result) {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            if (result) cognitoUser = result.user;
            console.log('Success! User ' + cognitoUser.getUsername() + ' has been created');
        });
    }

    public Login() {

        if (this.LoginUserName.length == 0 || this.LoginUserPassword.length == 0) {
            alert('username and password required');
            return;
        }

        let authenticationData = {
            Username: this.LoginUserName,
            Password: this.LoginUserPassword,
        };
        let authenticationDetails = new AuthenticationDetails(authenticationData);
        let userPool = new CognitoUserPool(this.PoolData);
        let userData = {
            Username: this.LoginUserName,
            Pool: userPool
        };
        let cognitoUser = new CognitoUser(userData);
        let that = this;
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                let accessToken = result.getAccessToken().getJwtToken();

                let currentUser = userPool.getCurrentUser();
                if (currentUser) {
                    let givenName = LoginComponent.GetUserAttribute(currentUser, 'given_name');
                }

                /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/
                that.IdToken = result.getIdToken().getJwtToken();
                //alert('idToken: ' + idToken);
            },

            onFailure: function (err) {
                alert('Login() ' + (err.message || JSON.stringify(err)));
            },
        });

    }

    public static GetUserAttribute(user: CognitoUser, attributeName: string) {

        user.getSession(() => { }); // https://github.com/amazon-archives/amazon-cognito-identity-js/issues/35

        user.getUserAttributes(function (err, result) {
            if (err) {
                alert('GetUserAttribute() ' + (err.message || JSON.stringify(err)));
                return '';
            }
            if (result) {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].getName().toLowerCase() == attributeName.toLowerCase()) {
                        let value = result[i].getValue();
                        alert('Welcome, ' + value);
                        return value;
                    }
                }
            }
        });
        return '';
    }

    public GetVehicleMakeSettings() {

        if (this.IdToken.length == 0) {
            alert('GetVehicleMakeSettings() token is not populated');
            return;
        }

        const header = new Headers();
        //header.append('Access-Control-Allow-Origin', '*');
        //header.append('Access-Control-Allow-Headers', 'Content-Type');
        //header.append('Access-Control-Allow-Methods', 'GET');
        header.append('Content-Type', 'application/json');
        header.append('Authorization', this.IdToken);
        const options = new RequestOptions({ headers: header });

        this.http.get('https://g3y8euza9g.execute-api.us-west-2.amazonaws.com/Test', options).subscribe(result => {
            this.VehicleMakeSettings = result.text();
        }, error => alert('GetVehicleMakeSettings() ' + error.message));
    }

}