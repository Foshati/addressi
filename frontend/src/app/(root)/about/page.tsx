import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">About Addressi</h1>
        <p className="text-xl text-muted-foreground mt-2">Your trusted partner for temporary communication.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p>In a world where online privacy is increasingly scarce, Addressi provides a simple, secure, and free solution to protect your personal information. We offer temporary email addresses and virtual phone numbers, allowing you to sign up for services, test applications, and communicate without exposing your real contact details.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why Choose Us?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Privacy First</h3>
            <p>We are committed to protecting your privacy. We don&lsquo;t require registration, and all messages are automatically deleted after a short period.</p>
          </div>
          <div>
            <h3 className="font-semibold">Completely Free</h3>
            <p>Our service is and will always be free. Get unlimited access to temporary emails and phone numbers without any hidden costs.</p>
          </div>
          <div>
            <h3 className="font-semibold">Easy to Use</h3>
            <p>Our platform is designed to be intuitive and user-friendly. Generate a new address or number with a single click and start receiving messages instantly.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
