import { Link } from "react-router-dom";
import lightFullLogo from "../images/full-logo-light.png";
import darkFullLogo from "../images/full-logo-dark.png";
import { ThemeContext } from "../App";
import { useContext } from "react";

const PrivacyPolicy = () => {

    let { theme } = useContext(ThemeContext);

    return (
        <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">

            <h1 className="text-4xl font-gelasio leading-7">Privacy Policy Page Under Construction</h1>
            <h2>Privacy Policy</h2>
            <h3>Effective Date: 1/25/2025</h3>
            <h4>1. Introduction</h4>
            <p>Welcome to christisking.info. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your data.</p>
            <h4>2. Data We Collect</h4>
            <p>Login Data: We collect your username and password when you create an account. This information is necessary to authenticate your identity and allow access to our services.</p>
            <p>Comments: When you leave comments on our website, we store this text along with your username to facilitate discussion and community engagement.</p>
            <p>Likes: We record when you like content to understand what users appreciate and to enhance user experience.</p>
            <p>Views: We track views on content to gauge popularity and improve our offerings.</p>
            <h4>3. Use of Your Data</h4>
            <p>Authentication: To log you into our platform securely.</p>
            <p>User Experience: To provide personalized content, enhance functionality, and improve our services based on user interaction.</p>
            <p>Security: To protect your account from unauthorized access.</p>
            <h4>4. Data Sharing and Disclosure</h4>
            <p>We do not sell any of your personal information to third parties. Your data is stored securely in a cloud database with access limited to authorized personnel only.</p>
            <h4>6. User Rights</h4>
            <p>You have the right to access, correct, or delete your personal data. Contact us at business@brandonpyle.com to exercise these rights.</p>
            <h4>7. Changes to This Privacy Policy</h4>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated effective date.</p>
            <h4>8. Contact Us</h4>
            <p>If you have any questions about this Privacy Policy, please contact us at: business@brandonpyle.com</p>

            <div className="mt-auto">
                <img src={ theme == "light" ? darkFullLogo : lightFullLogo } className="h-8 object-contain block mx-auto select-none" />
                <p className="mt-5 text-dark-grey">Proclaiming Christ is King by providing relevant apologetic and Biblical content to all.</p>
            </div>

        </section>
    )
}

export default PrivacyPolicy;