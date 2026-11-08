'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, Chip } from '@heroui/react';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Card.Header className="items-center text-center">
          <Chip size="sm" variant="soft" color="accent">
            관리자
          </Chip>
          <Card.Title className="text-2xl">MAP-DYOA</Card.Title>
          <Card.Description>
            지도동 일정 및 스트리머 관리를 위해 구글 계정으로 로그인이 필요합니다.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Button
            fullWidth
            onPress={() => {
              const next =
                new URLSearchParams(window.location.search).get('callbackUrl') ||
                '/calendar';
              void signIn('google', {
                callbackUrl: next.startsWith('/') ? next : '/calendar',
              });
            }}
          >
            <LogIn className="size-4" />
            구글 계정으로 시작하기
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
