"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserService from "@lib/UserService";

import styles from "./page.module.css";

function EyeIcon({ closed }: { closed: boolean }) {
	return (
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8ea1c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			{closed ? (
				<>
					<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
					<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
					<line x1="1" y1="1" x2="23" y2="23" />
				</>
			) : (
				<>
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
					<circle cx="12" cy="12" r="3" />
				</>
			)}
		</svg>
	);
}

export default function ChangePasswordPage() {
	const router = useRouter();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		let cancelled = false;

		const checkSession = async () => {
			const user = await UserService.getUser();

			if (cancelled) {
				return;
			}

			if (!user) {
				router.push("/auth");
				return;
			}

			setIsLoading(false);
		};

		void checkSession();

		return () => {
			cancelled = true;
		};
	}, [router]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setMessage("");

		if (!currentPassword.trim()) {
			setError("Current password is required");
			return;
		}

		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setIsSubmitting(true);

		try {
			await UserService.changePassword(currentPassword, newPassword);
			setMessage("Password changed successfully");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Failed to change password");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return <div className={styles.page} />;
	}

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<div className={styles.headerRow}>
					<button type="button" className={styles.backButton} onClick={() => router.push("/profile")}>
						← Profile
					</button>
					<h1 className={styles.pageTitle}>Change Password</h1>
					<button type="button" className={styles.backButtonRight} onClick={() => router.push("/")}>
						Lobby →
					</button>
				</div>

				<div className={styles.card}>
					<p className={styles.subtitle}>Change your account password while logged in.</p>

					<form onSubmit={handleSubmit} className={styles.form}>
						<div className={styles.field}>
							<label htmlFor="current-password" className={styles.label}>
								Current Password
							</label>
							<div className={styles.inputWrap}>
								<input
									id="current-password"
									type={showCurrentPassword ? "text" : "password"}
									autoComplete="current-password"
									value={currentPassword}
									onChange={(event) => setCurrentPassword(event.target.value)}
									placeholder="Your current password"
									className={`${styles.input} ${styles.inputWithIcon}`}
									required
								/>
								<button
									type="button"
									onClick={() => setShowCurrentPassword((value) => !value)}
									className={styles.eyeButton}
									aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>
									<EyeIcon closed={!showCurrentPassword} />
								</button>
							</div>
						</div>

						<div className={styles.field}>
							<label htmlFor="new-password" className={styles.label}>
								New Password
							</label>
							<div className={styles.inputWrap}>
								<input
									id="new-password"
									type={showNewPassword ? "text" : "password"}
									autoComplete="new-password"
									value={newPassword}
									onChange={(event) => setNewPassword(event.target.value)}
									placeholder="At least 8 characters"
									className={`${styles.input} ${styles.inputWithIcon}`}
									required
								/>
								<button
									type="button"
									onClick={() => setShowNewPassword((value) => !value)}
									className={styles.eyeButton}
									aria-label={showNewPassword ? "Hide new password" : "Show new password"}>
									<EyeIcon closed={!showNewPassword} />
								</button>
							</div>
						</div>

						<div className={styles.field}>
							<label htmlFor="confirm-password" className={styles.label}>
								Confirm New Password
							</label>
							<div className={styles.inputWrap}>
								<input
									id="confirm-password"
									type={showConfirmPassword ? "text" : "password"}
									autoComplete="new-password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									placeholder="Type again"
									className={`${styles.input} ${styles.inputWithIcon}`}
									required
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword((value) => !value)}
									className={styles.eyeButton}
									aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
									<EyeIcon closed={!showConfirmPassword} />
								</button>
							</div>
						</div>

						{error && <p className={`${styles.message} ${styles.messageError}`}>{error}</p>}
						{message && <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p>}

						<div className={styles.actionRow}>
							<button type="submit" className={styles.submitButton} disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Password"}
							</button>
							<button type="button" className={styles.secondaryButton} onClick={() => router.push("/profile")}>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
